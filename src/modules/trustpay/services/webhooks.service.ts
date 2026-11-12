import type { TpWebhookEvent } from "@prisma/client";
import { hmacSha256Hex, timingSafeEqualHex } from "@/lib/crypto";
import type { TrustPayContext } from "@/modules/trustpay/context";

/** Backoff schedule: 30s, 2m, 10m, 1h, 6h, 24h (then clamp). */
const BACKOFF_MS = [
  30_000,
  2 * 60_000,
  10 * 60_000,
  60 * 60_000,
  6 * 60 * 60_000,
  24 * 60 * 60_000,
] as const;

const MAX_ATTEMPTS = 8;
const SIGNATURE_TOLERANCE_SEC = 300;

export function nextBackoffMs(attemptsAfterFailure: number): number {
  const idx = Math.min(Math.max(attemptsAfterFailure - 1, 0), BACKOFF_MS.length - 1);
  return BACKOFF_MS[idx]!;
}

/**
 * Build `TrustPay-Signature: t=<unix>,v1=<hex>` over `${t}.${rawBody}`.
 */
export function signWebhookPayload(
  secret: string,
  rawBody: string,
  timestampSec: number,
): string {
  const v1 = hmacSha256Hex(secret, `${timestampSec}.${rawBody}`);
  return `t=${timestampSec},v1=${v1}`;
}

/**
 * Verify TrustPay-Signature header. Rejects missing/invalid/tampered/stale (>5 min).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
  nowMs: number = Date.now(),
): boolean {
  if (!signatureHeader) return false;

  const parts: Record<string, string> = {};
  for (const piece of signatureHeader.split(",")) {
    const [k, ...rest] = piece.trim().split("=");
    if (!k || rest.length === 0) continue;
    parts[k] = rest.join("=");
  }

  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;

  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > SIGNATURE_TOLERANCE_SEC) {
    return false;
  }

  const expected = hmacSha256Hex(secret, `${t}.${rawBody}`);
  return timingSafeEqualHex(expected, v1);
}

async function deliverOne(
  ctx: TrustPayContext,
  event: TpWebhookEvent & { merchant?: { webhookUrl: string; webhookSecret: string } },
): Promise<boolean> {
  const merchant =
    event.merchant ??
    (await ctx.db.tpMerchant.findUnique({
      where: { id: event.merchantId },
      select: { webhookUrl: true, webhookSecret: true },
    }));

  if (!merchant) {
    await ctx.db.tpWebhookEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        lastError: "Merchant missing",
        attempts: { increment: 1 },
      },
    });
    return false;
  }

  const rawBody = JSON.stringify(event.payload);
  const now = await ctx.now();
  const timestampSec = Math.floor(now.getTime() / 1000);
  const signature = signWebhookPayload(merchant.webhookSecret, rawBody, timestampSec);

  const result = await ctx.transport.deliver(
    merchant.webhookUrl,
    {
      "TrustPay-Signature": signature,
      "Content-Type": "application/json",
      "X-TrustPay-Event": event.type,
      "X-TrustPay-Delivery": event.id,
    },
    rawBody,
  );

  if (result.ok) {
    await ctx.db.tpWebhookEvent.update({
      where: { id: event.id },
      data: {
        status: "DELIVERED",
        deliveredAt: now,
        lastError: null,
        attempts: { increment: 1 },
      },
    });
    return true;
  }

  const attempts = event.attempts + 1;
  const terminal = attempts >= MAX_ATTEMPTS;
  const nextAttemptAt = new Date(now.getTime() + nextBackoffMs(attempts));

  await ctx.db.tpWebhookEvent.update({
    where: { id: event.id },
    data: {
      status: terminal ? "FAILED" : "PENDING",
      attempts,
      lastError: result.error ?? `HTTP ${result.status}`,
      nextAttemptAt: terminal ? event.nextAttemptAt : nextAttemptAt,
    },
  });
  return false;
}

/** Deliver due PENDING webhook events (nextAttemptAt <= now). */
export async function deliverDueWebhooks(
  ctx: TrustPayContext,
  limit = 50,
): Promise<{ delivered: number; failed: number }> {
  const now = await ctx.now();
  const due = await ctx.db.tpWebhookEvent.findMany({
    where: {
      status: "PENDING",
      nextAttemptAt: { lte: now },
    },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
  });

  let delivered = 0;
  let failed = 0;
  for (const event of due) {
    const ok = await deliverOne(ctx, event);
    if (ok) delivered += 1;
    else failed += 1;
  }
  return { delivered, failed };
}

/** Force retry a single webhook event immediately. */
export async function retryWebhook(
  ctx: TrustPayContext,
  eventId: string,
): Promise<boolean> {
  const event = await ctx.db.tpWebhookEvent.findUnique({ where: { id: eventId } });
  if (!event) return false;
  if (event.status === "DELIVERED") return true;
  return deliverOne(ctx, event);
}
