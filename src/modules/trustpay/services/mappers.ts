import type { TpPayment, TpPayout } from "@prisma/client";
import type { Payment, Payout } from "@/contracts/trustpay";

export function toPaymentDto(p: TpPayment): Payment {
  return {
    id: p.id,
    reference: p.reference,
    description: p.description,
    amountMinor: p.amountMinor,
    feeMinor: p.feeMinor,
    netMinor: p.netMinor,
    currency: "GHS",
    status: p.status,
    network: p.network,
    payerPhone: p.payerPhone,
    heldAt: p.heldAt?.toISOString() ?? null,
    shippedAt: p.shippedAt?.toISOString() ?? null,
    autoReleaseAt: p.autoReleaseAt?.toISOString() ?? null,
    releasedAt: p.releasedAt?.toISOString() ?? null,
    refundedAt: p.refundedAt?.toISOString() ?? null,
    expiresAt: p.expiresAt.toISOString(),
    failureReason: p.failureReason,
    createdAt: p.createdAt.toISOString(),
  };
}

export function toPayoutDto(p: TpPayout): Payout {
  return {
    id: p.id,
    amountMinor: p.amountMinor,
    network: p.network,
    phone: p.phone,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    completedAt: p.completedAt?.toISOString() ?? null,
  };
}
