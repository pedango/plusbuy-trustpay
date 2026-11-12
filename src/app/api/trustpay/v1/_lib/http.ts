import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { sha256Hex, timingSafeEqualHex } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { getSession } from "@/lib/session";
import { requireTrustPayAdmin } from "@/lib/authz";
import { isTrustPayError, TrustPayError } from "@/modules/trustpay/domain/errors";
import type { TrustPayContext } from "@/modules/trustpay/context";
import {
  beginIdempotency,
  storeIdempotency,
  type IdempotencyFresh,
} from "@/modules/trustpay/services/idempotency.service";
import { deliverDueWebhooks } from "@/modules/trustpay/services/webhooks.service";

export function requestIdFrom(request: Request): string {
  return request.headers.get("x-request-id")?.trim() || newId("req");
}

export function jsonOk(requestId: string, data: unknown, status = 200): NextResponse {
  return NextResponse.json(
    { data, requestId },
    { status, headers: { "X-Request-Id": requestId } },
  );
}

export function jsonError(
  requestId: string,
  error: unknown,
): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Invalid request",
          details: error.issues,
        },
        requestId,
      },
      { status: 422, headers: { "X-Request-Id": requestId } },
    );
  }
  if (isTrustPayError(error)) {
    return NextResponse.json(
      {
        error: { code: error.code, message: error.message, details: error.details },
        requestId,
      },
      { status: error.status, headers: { "X-Request-Id": requestId } },
    );
  }
  const message = error instanceof Error ? error.message : "Internal error";
  console.error(JSON.stringify({ level: "error", msg: message, requestId }));
  return NextResponse.json(
    { error: { code: "internal_error", message: "Internal error" }, requestId },
    { status: 500, headers: { "X-Request-Id": requestId } },
  );
}

export async function requireMerchant(request: Request, ctx: TrustPayContext) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token.startsWith("tp_test_")) {
    throw new TrustPayError("unauthorized", "Missing or invalid API key");
  }
  const hash = sha256Hex(token);
  const merchant = await ctx.db.tpMerchant.findUnique({ where: { apiKeyHash: hash } });
  if (!merchant || !timingSafeEqualHex(hash, merchant.apiKeyHash)) {
    throw new TrustPayError("unauthorized", "Invalid API key");
  }
  return merchant;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new TrustPayError("unauthorized", "Admin session required");
  try {
    requireTrustPayAdmin(session);
  } catch {
    throw new TrustPayError("forbidden", "TrustPay admin access required");
  }
  return session;
}

export async function withIdempotency(
  ctx: TrustPayContext,
  request: Request,
  merchantId: string,
  path: string,
  body: unknown,
  run: (tx: Prisma.TransactionClient) => Promise<{ status: number; data: unknown }>,
): Promise<{ status: number; data: unknown }> {
  const key = request.headers.get("idempotency-key")?.trim();
  if (!key) {
    throw new TrustPayError("validation_error", "Idempotency-Key header is required");
  }
  return ctx.db.$transaction(async (tx) => {
    const begun = await beginIdempotency(tx, {
      merchantId,
      key,
      method: request.method,
      path,
      body,
    });
    if (begun.replay) {
      const stored = begun.body as { data?: unknown };
      return { status: begun.status, data: stored?.data ?? begun.body };
    }
    const result = await run(tx);
    await storeIdempotency(tx, begun as IdempotencyFresh, result.status, { data: result.data });
    return result;
  }, { maxWait: 10_000, timeout: 20_000 });
}

export async function flushWebhooks(ctx: TrustPayContext): Promise<void> {
  try {
    await deliverDueWebhooks(ctx);
  } catch (error) {
    ctx.logger.error({
      msg: "webhook_flush_failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
