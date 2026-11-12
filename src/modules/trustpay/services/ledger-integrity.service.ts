import type { TrustPayContext } from "@/modules/trustpay/context";

export type IntegrityCheck = {
  id: string;
  label: string;
  pass: boolean;
  detail?: string;
};

/** Run the five ledger invariants exposed to admin. */
export async function checkLedgerIntegrity(ctx: TrustPayContext): Promise<IntegrityCheck[]> {
  const txns = await ctx.db.tpLedgerTxn.findMany({ include: { entries: true } });
  const allEntries = await ctx.db.tpLedgerEntry.findMany();
  const heldOrDisputed = await ctx.db.tpPayment.findMany({
    where: { status: { in: ["HELD", "DISPUTED"] } },
  });
  const released = await ctx.db.tpPayment.findMany({ where: { status: "RELEASED" } });

  const txnBalanced = txns.every(
    (t) => t.entries.reduce((s, e) => s + e.amountMinor, 0) === 0,
  );

  const globalSum = allEntries.reduce((s, e) => s + e.amountMinor, 0);

  const escrowSum = allEntries
    .filter((e) => e.account === "ESCROW")
    .reduce((s, e) => s + e.amountMinor, 0);
  const expectedEscrow = heldOrDisputed.reduce((s, p) => s + p.amountMinor, 0);

  const availableByMerchant = new Map<string, number>();
  for (const e of allEntries.filter((x) => x.account === "MERCHANT_AVAILABLE")) {
    availableByMerchant.set(
      e.merchantId,
      (availableByMerchant.get(e.merchantId) ?? 0) + e.amountMinor,
    );
  }
  const availableNeverNegative = [...availableByMerchant.values()].every((v) => v >= 0);

  let releasedNetOk = true;
  let releasedDetail: string | undefined;
  for (const p of released) {
    const credit = allEntries
      .filter(
        (e) =>
          e.account === "MERCHANT_AVAILABLE" &&
          e.amountMinor > 0 &&
          txns.some((t) => t.id === e.txnId && t.paymentId === p.id && t.type === "RELEASE"),
      )
      .reduce((s, e) => s + e.amountMinor, 0);
    if (credit !== p.netMinor) {
      releasedNetOk = false;
      releasedDetail = `${p.id}: expected net ${p.netMinor}, got ${credit}`;
      break;
    }
  }

  return [
    {
      id: "txn_balanced",
      label: "Every ledger transaction sums to 0",
      pass: txnBalanced,
    },
    {
      id: "global_zero",
      label: "Global sum of all ledger entries is 0",
      pass: globalSum === 0,
      detail: `sum=${globalSum}`,
    },
    {
      id: "escrow_matches_held",
      label: "ESCROW balance equals HELD+DISPUTED payment amounts",
      pass: escrowSum === expectedEscrow,
      detail: `escrow=${escrowSum} expected=${expectedEscrow}`,
    },
    {
      id: "available_non_negative",
      label: "Available balance never negative",
      pass: availableNeverNegative,
    },
    {
      id: "released_net",
      label: "RELEASED payments credit MERCHANT_AVAILABLE with netMinor",
      pass: releasedNetOk,
      detail: releasedDetail,
    },
  ];
}
