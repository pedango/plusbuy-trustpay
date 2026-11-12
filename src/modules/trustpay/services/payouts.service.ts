import type { Prisma } from "@prisma/client";
import { newId } from "@/lib/ids";
import type { TpNetwork } from "@/contracts/trustpay";
import type { TrustPayContext } from "@/modules/trustpay/context";
import { TrustPayError } from "@/modules/trustpay/domain/errors";
import { normalizeGhanaPhone } from "@/modules/trustpay/domain/phone";
import { recipeWithdrawal } from "@/modules/trustpay/domain/ledger";
import { getMerchantBalance } from "@/modules/trustpay/services/balances.service";

/** Create a withdrawal from available balance (row-lock merchant to prevent overdraw). */
export async function createPayout(
  ctx: TrustPayContext,
  input: {
    merchantId: string;
    amountMinor: number;
    network: TpNetwork;
    phone: string;
  },
  tx?: Prisma.TransactionClient,
) {
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new TrustPayError("validation_error", "Invalid payout amount");
  }
  const phone = normalizeGhanaPhone(input.phone, input.network).e164;

  const run = async (db: Prisma.TransactionClient) => {
    await db.$queryRaw`SELECT id FROM "TpMerchant" WHERE id = ${input.merchantId} FOR UPDATE`;

    const agg = await db.tpLedgerEntry.aggregate({
      where: { merchantId: input.merchantId, account: "MERCHANT_AVAILABLE" },
      _sum: { amountMinor: true },
    });
    const available = agg._sum.amountMinor ?? 0;
    if (input.amountMinor > available) {
      throw new TrustPayError(
        "insufficient_available_balance",
        "Insufficient available balance",
      );
    }

    const payoutId = newId("pout");
    const txnId = newId("txn");
    const lines = recipeWithdrawal(input.amountMinor);

    await db.tpLedgerTxn.create({
      data: {
        id: txnId,
        merchantId: input.merchantId,
        type: "WITHDRAWAL",
        memo: `Payout ${payoutId}`,
        entries: {
          create: lines.map((line) => ({
            id: newId("ent"),
            merchantId: input.merchantId,
            account: line.account,
            amountMinor: line.amountMinor,
          })),
        },
      },
    });

    return db.tpPayout.create({
      data: {
        id: payoutId,
        merchantId: input.merchantId,
        amountMinor: input.amountMinor,
        network: input.network,
        phone,
        status: "PROCESSING",
      },
    });
  };

  if (tx) return run(tx);
  return ctx.db.$transaction((inner) => run(inner), { maxWait: 10_000, timeout: 20_000 });
}

/** Lazily complete PROCESSING payouts older than 2 seconds (by Clock). */
export async function completeDuePayouts(ctx: TrustPayContext): Promise<number> {
  const cutoff = new Date((await ctx.now()).getTime() - 2000);
  const due = await ctx.db.tpPayout.findMany({
    where: { status: "PROCESSING", createdAt: { lte: cutoff } },
    take: 50,
  });

  let completed = 0;
  for (const payout of due) {
    const result = await ctx.provider.sendPayout({
      network: payout.network,
      phone: payout.phone,
      amountMinor: payout.amountMinor,
    });
    await ctx.db.tpPayout.update({
      where: { id: payout.id },
      data: {
        status: result.outcome === "PAID" ? "PAID" : "FAILED",
        completedAt: await ctx.now(),
      },
    });
    completed += 1;
  }
  return completed;
}

export async function listPayouts(ctx: TrustPayContext, merchantId: string) {
  await completeDuePayouts(ctx);
  return ctx.db.tpPayout.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function assertCanWithdraw(
  ctx: TrustPayContext,
  merchantId: string,
  amountMinor: number,
): Promise<void> {
  const bal = await getMerchantBalance(ctx, merchantId);
  if (amountMinor > bal.availableMinor) {
    throw new TrustPayError(
      "insufficient_available_balance",
      "Insufficient available balance",
    );
  }
}
