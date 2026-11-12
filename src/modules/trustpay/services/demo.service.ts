import type { TrustPayContext } from "@/modules/trustpay/context";
import { runMaintenance } from "@/modules/trustpay/services/maintenance.service";

/** Advance the TrustPay demo clock by N days, then run maintenance. */
export async function fastForwardDays(ctx: TrustPayContext, days: number) {
  if (!Number.isFinite(days) || days <= 0 || days > 3650) {
    throw new Error("days must be between 1 and 3650");
  }
  const seconds = Math.floor(days * 24 * 60 * 60);
  await ctx.db.tpDemoClock.upsert({
    where: { id: 1 },
    create: { id: 1, offsetSeconds: seconds },
    update: { offsetSeconds: { increment: seconds } },
  });
  return runMaintenance(ctx);
}

/**
 * Wipe TrustPay + shop demo data. Caller must re-seed afterwards.
 * Uses TRUNCATE ... RESTART IDENTITY CASCADE.
 */
export async function resetDemoData(ctx: TrustPayContext): Promise<void> {
  await ctx.db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "TpLedgerEntry",
      "TpLedgerTxn",
      "TpWebhookEvent",
      "TpIdempotencyKey",
      "TpDispute",
      "TpPayout",
      "TpPayment",
      "TpMerchant",
      "TpDemoClock",
      "ProcessedWebhook",
      "OrderEvent",
      "OrderItem",
      "Order",
      "OrderSequence",
      "LoginAttempt",
      "Product",
      "User"
    RESTART IDENTITY CASCADE
  `);
}
