import type { TrustPayContext } from "@/modules/trustpay/context";

export type MerchantBalance = {
  escrowMinor: number;
  availableMinor: number;
  withdrawnMinor: number;
  feesPaidMinor: number;
  pendingEscrowCount: number;
  currency: "GHS";
};

async function sumAccount(
  ctx: TrustPayContext,
  merchantId: string,
  account: "ESCROW" | "MERCHANT_AVAILABLE" | "MERCHANT_WITHDRAWN" | "TRUSTPAY_REVENUE",
): Promise<number> {
  const agg = await ctx.db.tpLedgerEntry.aggregate({
    where: { merchantId, account },
    _sum: { amountMinor: true },
  });
  return agg._sum.amountMinor ?? 0;
}

/** Derive merchant balances from the immutable ledger. */
export async function getMerchantBalance(
  ctx: TrustPayContext,
  merchantId: string,
): Promise<MerchantBalance> {
  const [escrowMinor, availableMinor, withdrawnMinor, feesPaidMinor, pendingEscrowCount] =
    await Promise.all([
      sumAccount(ctx, merchantId, "ESCROW"),
      sumAccount(ctx, merchantId, "MERCHANT_AVAILABLE"),
      sumAccount(ctx, merchantId, "MERCHANT_WITHDRAWN"),
      sumAccount(ctx, merchantId, "TRUSTPAY_REVENUE"),
      ctx.db.tpPayment.count({
        where: { merchantId, status: { in: ["HELD", "DISPUTED"] } },
      }),
    ]);

  return {
    escrowMinor,
    availableMinor,
    withdrawnMinor,
    feesPaidMinor,
    pendingEscrowCount,
    currency: "GHS",
  };
}

export async function listLedger(
  ctx: TrustPayContext,
  merchantId: string,
  opts: { limit?: number; cursor?: string } = {},
): Promise<{
  items: Array<{
    id: string;
    type: "HOLD" | "RELEASE" | "REFUND" | "WITHDRAWAL";
    memo: string | null;
    amountMinor: number;
    createdAt: string;
    paymentId: string | null;
  }>;
  nextCursor: string | null;
}> {
  const limit = Math.min(opts.limit ?? 20, 100);
  const txns = await ctx.db.tpLedgerTxn.findMany({
    where: {
      merchantId,
      ...(opts.cursor ? { createdAt: { lt: new Date(opts.cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: { entries: true },
  });

  const page = txns.slice(0, limit);
  const items = page.map((txn) => {
    const merchantFacing =
      txn.entries.find((e) =>
        ["MERCHANT_AVAILABLE", "ESCROW", "MERCHANT_WITHDRAWN", "BUYER_REFUNDED"].includes(
          e.account,
        ),
      ) ?? txn.entries[0];
    return {
      id: txn.id,
      type: txn.type,
      memo: txn.memo,
      amountMinor: merchantFacing?.amountMinor ?? 0,
      createdAt: txn.createdAt.toISOString(),
      paymentId: txn.paymentId,
    };
  });

  const next = txns.length > limit ? (page[page.length - 1]?.createdAt.toISOString() ?? null) : null;
  return { items, nextCursor: next };
}
