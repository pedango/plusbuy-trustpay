import {
  CreatePaymentRequestSchema,
  CreatePaymentResponseSchema,
  CreatePayoutRequestSchema,
  LedgerEntrySchema,
  MerchantBalanceSchema,
  PaymentSchema,
  PayoutSchema,
  WebhookPayloadSchema,
  type CreatePaymentRequest,
  type CreatePaymentResponse,
  type CreatePayoutRequest,
  type LedgerEntry,
  type MerchantBalance,
  type Payment,
  type Payout,
  type WebhookPayload,
} from "@/contracts/trustpay";
import { getEnv } from "@/lib/env";
import { createRequestId } from "@/lib/request-context";
import { hmacSha256Hex, timingSafeEqualHex } from "@/lib/crypto";
import { z } from "zod";

export class TrustPayError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly requestId: string,
  ) {
    super(message);
    this.name = "TrustPayError";
  }
}

type ClientOptions = {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
};

async function tpFetch<T>(
  path: string,
  init: {
    method: string;
    body?: unknown;
    idempotencyKey?: string;
    schema: z.ZodType<T>;
    options?: ClientOptions;
  },
): Promise<T> {
  const env = getEnv();
  const baseUrl = init.options?.baseUrl ?? env.TRUSTPAY_BASE_URL;
  const apiKey = init.options?.apiKey ?? env.TRUSTPAY_API_KEY;
  const timeoutMs = init.options?.timeoutMs ?? 30_000;
  const requestId = createRequestId();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "X-Request-Id": requestId,
  };

  let body: string | undefined;
  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  if (init.idempotencyKey) {
    headers["Idempotency-Key"] = init.idempotencyKey;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/api/trustpay/v1${path}`, {
      method: init.method,
      headers,
      body,
      signal: controller.signal,
    });

    const json: unknown = await res.json().catch(() => ({}));
    const requestIdHeader = res.headers.get("X-Request-Id") ?? requestId;

    if (!res.ok) {
      const err = z
        .object({
          error: z.object({ code: z.string(), message: z.string() }).passthrough(),
          requestId: z.string().optional(),
        })
        .safeParse(json);
      throw new TrustPayError(
        err.success ? err.data.error.code : "internal_error",
        res.status,
        err.success ? err.data.error.message : "TrustPay request failed",
        err.success ? (err.data.requestId ?? requestIdHeader) : requestIdHeader,
      );
    }

    const parsed = z.object({ data: init.schema, requestId: z.string() }).safeParse(json);
    if (!parsed.success) {
      throw new TrustPayError("internal_error", 500, "Invalid TrustPay response", requestIdHeader);
    }
    return parsed.data.data;
  } catch (error) {
    if (error instanceof TrustPayError) throw error;
    throw new TrustPayError(
      "internal_error",
      500,
      error instanceof Error ? error.message : "TrustPay network error",
      requestId,
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Shop-facing TrustPay HTTP client. The only shop→TrustPay integration point. */
export const trustpayClient = {
  createPayment(input: CreatePaymentRequest, idempotencyKey: string): Promise<CreatePaymentResponse> {
    const body = CreatePaymentRequestSchema.parse(input);
    return tpFetch("/payments", {
      method: "POST",
      body,
      idempotencyKey,
      schema: CreatePaymentResponseSchema,
    });
  },

  getPayment(id: string): Promise<Payment> {
    return tpFetch(`/payments/${id}`, { method: "GET", schema: PaymentSchema });
  },

  recordShipment(id: string, idempotencyKey: string): Promise<Payment> {
    return tpFetch(`/payments/${id}/shipment`, {
      method: "POST",
      body: {},
      idempotencyKey,
      schema: PaymentSchema,
    });
  },

  releasePayment(id: string, idempotencyKey: string): Promise<Payment> {
    return tpFetch(`/payments/${id}/release`, {
      method: "POST",
      body: {},
      idempotencyKey,
      schema: PaymentSchema,
    });
  },

  refundPayment(id: string, idempotencyKey: string): Promise<Payment> {
    return tpFetch(`/payments/${id}/refund`, {
      method: "POST",
      body: {},
      idempotencyKey,
      schema: PaymentSchema,
    });
  },

  openDispute(id: string, reason: string, idempotencyKey: string): Promise<Payment> {
    return tpFetch(`/payments/${id}/dispute`, {
      method: "POST",
      body: { reason },
      idempotencyKey,
      schema: PaymentSchema,
    });
  },

  getMerchantBalance(): Promise<MerchantBalance> {
    return tpFetch("/merchant/balance", { method: "GET", schema: MerchantBalanceSchema });
  },

  async listLedger(params?: { limit?: number; cursor?: string }): Promise<{
    items: LedgerEntry[];
    nextCursor: string | null;
  }> {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.cursor) q.set("cursor", params.cursor);
    const suffix = q.toString() ? `?${q}` : "";
    return tpFetch(`/merchant/ledger${suffix}`, {
      method: "GET",
      schema: z.object({
        items: z.array(LedgerEntrySchema),
        nextCursor: z.string().nullable(),
      }),
    });
  },

  createPayout(input: CreatePayoutRequest, idempotencyKey: string): Promise<Payout> {
    const body = CreatePayoutRequestSchema.parse(input);
    return tpFetch("/merchant/payouts", {
      method: "POST",
      body,
      idempotencyKey,
      schema: PayoutSchema,
    });
  },

  listPayouts(): Promise<Payout[]> {
    return tpFetch("/merchant/payouts", { method: "GET", schema: z.array(PayoutSchema) });
  },

  /**
   * Verify TrustPay-Signature header: `t=<unix>,v1=<hex>`.
   * Rejects timestamps older than 5 minutes.
   */
  verifyWebhook(
    rawBody: string,
    signatureHeader: string | null,
    secret: string,
    nowMs: number = Date.now(),
  ): WebhookPayload {
    if (!signatureHeader) {
      throw new TrustPayError("unauthorized", 401, "Missing TrustPay-Signature", "webhook");
    }
    const parts = Object.fromEntries(
      signatureHeader.split(",").map((p) => {
        const [k, ...rest] = p.trim().split("=");
        return [k, rest.join("=")];
      }),
    );
    const t = parts.t;
    const v1 = parts.v1;
    if (!t || !v1) {
      throw new TrustPayError("unauthorized", 401, "Invalid signature header", "webhook");
    }
    const ts = Number(t);
    if (!Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > 300) {
      throw new TrustPayError("unauthorized", 401, "Stale webhook timestamp", "webhook");
    }
    const expected = hmacSha256Hex(secret, `${t}.${rawBody}`);
    if (!timingSafeEqualHex(expected, v1)) {
      throw new TrustPayError("unauthorized", 401, "Invalid webhook signature", "webhook");
    }
    return WebhookPayloadSchema.parse(JSON.parse(rawBody));
  },
};
