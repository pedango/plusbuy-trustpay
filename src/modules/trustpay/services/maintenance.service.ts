import type { TrustPayContext } from "@/modules/trustpay/context";
import { transition } from "@/modules/trustpay/services/escrow.service";
import { completeDuePayouts } from "@/modules/trustpay/services/payouts.service";
import { deliverDueWebhooks } from "@/modules/trustpay/services/webhooks.service";

/** Idempotent maintenance: auto-release, expiry, webhooks, payouts. */
export async function runMaintenance(ctx: TrustPayContext): Promise<{
  autoReleased: number;
  expired: number;
  webhooks: number;
  payouts: number;
}> {
  const now = await ctx.now();

  const dueRelease = await ctx.db.tpPayment.findMany({
    where: { status: "HELD", autoReleaseAt: { lte: now } },
    take: 100,
  });

  let autoReleased = 0;
  for (const payment of dueRelease) {
    try {
      await transition(payment.id, "AUTO_RELEASE_DUE", ctx);
      autoReleased += 1;
    } catch {
      // concurrent or guard failed
    }
  }

  const dueExpiry = await ctx.db.tpPayment.findMany({
    where: {
      status: { in: ["INITIATED", "AWAITING_APPROVAL"] },
      expiresAt: { lte: now },
    },
    take: 100,
  });

  let expired = 0;
  for (const payment of dueExpiry) {
    try {
      await transition(payment.id, "EXPIRY_ELAPSED", ctx);
      expired += 1;
    } catch {
      // ignore
    }
  }

  const webhookResult = await deliverDueWebhooks(ctx);
  const payouts = await completeDuePayouts(ctx);

  return {
    autoReleased,
    expired,
    webhooks: webhookResult.delivered,
    payouts,
  };
}
