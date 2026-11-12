import type { Prisma } from "@prisma/client";
import type { Payment } from "@/contracts/trustpay";
import type { TrustPayContext } from "@/modules/trustpay/context";
import { TrustPayError } from "@/modules/trustpay/domain/errors";
import { transition } from "@/modules/trustpay/services/escrow.service";
import { toPaymentDto } from "@/modules/trustpay/services/mappers";

export async function openDispute(
  ctx: TrustPayContext,
  paymentId: string,
  reason: string,
  merchantId?: string,
  tx?: Prisma.TransactionClient,
): Promise<Payment> {
  const db = tx ?? ctx.db;
  const payment = await db.tpPayment.findUnique({ where: { id: paymentId } });
  if (!payment || (merchantId && payment.merchantId !== merchantId)) {
    throw new TrustPayError("not_found", "Payment not found", { paymentId });
  }

  const existing = await db.tpDispute.findFirst({
    where: { paymentId, status: "OPEN" },
  });
  if (existing) {
    throw new TrustPayError("invalid_transition", "Payment already has an open dispute", {
      paymentId,
    });
  }

  const updated = await transition(
    paymentId,
    "DISPUTE_OPENED",
    ctx,
    { disputeReason: reason },
    tx,
  );
  return toPaymentDto(updated);
}

export async function resolveDispute(
  ctx: TrustPayContext,
  disputeId: string,
  resolution: "REFUND" | "RELEASE",
  resolutionNote?: string,
): Promise<Payment> {
  const dispute = await ctx.db.tpDispute.findUnique({
    where: { id: disputeId },
  });
  if (!dispute) {
    throw new TrustPayError("not_found", "Dispute not found", { disputeId });
  }
  if (dispute.status !== "OPEN") {
    throw new TrustPayError("invalid_transition", "Dispute is already resolved", {
      disputeId,
      status: dispute.status,
    });
  }

  const event = resolution === "REFUND" ? "DISPUTE_RESOLVED_REFUND" : "DISPUTE_RESOLVED_RELEASE";
  const updated = await transition(dispute.paymentId, event, ctx, {
    disputeId,
    disputeResolutionNote: resolutionNote ?? resolution,
  });
  return toPaymentDto(updated);
}
