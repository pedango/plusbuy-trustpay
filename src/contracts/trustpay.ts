import { z } from "zod";

export const TpNetworkSchema = z.enum(["MTN_MOMO", "TELECEL_CASH", "AIRTELTIGO_MONEY"]);
export const TpPaymentStatusSchema = z.enum([
  "INITIATED",
  "AWAITING_APPROVAL",
  "HELD",
  "DISPUTED",
  "RELEASED",
  "REFUNDED",
  "FAILED",
  "EXPIRED",
]);

export const CreatePaymentRequestSchema = z
  .object({
    amountMinor: z.number().int(),
    reference: z.string().min(1).max(64),
    description: z.string().max(280).optional(),
    returnUrl: z.string().url(),
  })
  .strict();

export const CreatePaymentResponseSchema = z
  .object({
    id: z.string(),
    status: z.literal("INITIATED"),
    checkoutUrl: z.string().url(),
    expiresAt: z.string().datetime(),
  })
  .strict();

export const PaymentSchema = z
  .object({
    id: z.string(),
    reference: z.string(),
    description: z.string().nullable().optional(),
    amountMinor: z.number().int(),
    feeMinor: z.number().int(),
    netMinor: z.number().int(),
    currency: z.literal("GHS"),
    status: TpPaymentStatusSchema,
    network: TpNetworkSchema.nullable().optional(),
    payerPhone: z.string().nullable().optional(),
    heldAt: z.string().datetime().nullable().optional(),
    shippedAt: z.string().datetime().nullable().optional(),
    autoReleaseAt: z.string().datetime().nullable().optional(),
    releasedAt: z.string().datetime().nullable().optional(),
    refundedAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime(),
    failureReason: z.string().nullable().optional(),
    createdAt: z.string().datetime(),
  })
  .strict();

export const MerchantBalanceSchema = z
  .object({
    escrowMinor: z.number().int(),
    availableMinor: z.number().int(),
    withdrawnMinor: z.number().int(),
    feesPaidMinor: z.number().int(),
    pendingEscrowCount: z.number().int(),
    currency: z.literal("GHS"),
  })
  .strict();

export const LedgerEntrySchema = z
  .object({
    id: z.string(),
    type: z.enum(["HOLD", "RELEASE", "REFUND", "WITHDRAWAL"]),
    memo: z.string().nullable().optional(),
    amountMinor: z.number().int(),
    createdAt: z.string().datetime(),
    paymentId: z.string().nullable().optional(),
  })
  .strict();

export const CreatePayoutRequestSchema = z
  .object({
    amountMinor: z.number().int().positive(),
    network: TpNetworkSchema,
    phone: z.string().min(10).max(16),
  })
  .strict();

export const PayoutSchema = z
  .object({
    id: z.string(),
    amountMinor: z.number().int(),
    network: TpNetworkSchema,
    phone: z.string(),
    status: z.enum(["PROCESSING", "PAID", "FAILED"]),
    createdAt: z.string().datetime(),
    completedAt: z.string().datetime().nullable().optional(),
  })
  .strict();

export const DisputeRequestSchema = z
  .object({
    reason: z.string().min(3).max(500),
  })
  .strict();

export const CheckoutStartSchema = z
  .object({
    network: TpNetworkSchema,
    phone: z.string().min(10).max(16),
  })
  .strict();

export const CheckoutApproveSchema = z
  .object({
    pin: z.string().regex(/^\d{4}$/),
  })
  .strict();

export const WebhookPayloadSchema = z
  .object({
    id: z.string(),
    type: z.enum([
      "payment.held",
      "payment.released",
      "payment.refunded",
      "payment.disputed",
      "payment.failed",
      "payment.expired",
    ]),
    createdAt: z.string().datetime(),
    data: z
      .object({
        paymentId: z.string(),
        reference: z.string(),
        status: TpPaymentStatusSchema,
        amountMinor: z.number().int(),
        feeMinor: z.number().int(),
        netMinor: z.number().int(),
      })
      .strict(),
  })
  .strict();

export const ApiSuccessSchema = <T extends z.ZodType>(data: T) =>
  z.object({ data, requestId: z.string() }).strict();

export const ApiErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .strict(),
    requestId: z.string(),
  })
  .strict();

export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;
export type CreatePaymentResponse = z.infer<typeof CreatePaymentResponseSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type MerchantBalance = z.infer<typeof MerchantBalanceSchema>;
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
export type CreatePayoutRequest = z.infer<typeof CreatePayoutRequestSchema>;
export type Payout = z.infer<typeof PayoutSchema>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
export type TpNetwork = z.infer<typeof TpNetworkSchema>;
export type TpPaymentStatus = z.infer<typeof TpPaymentStatusSchema>;
