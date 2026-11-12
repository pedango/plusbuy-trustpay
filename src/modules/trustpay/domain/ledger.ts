export type LedgerAccount =
  | "BUYER_WALLET"
  | "ESCROW"
  | "MERCHANT_AVAILABLE"
  | "TRUSTPAY_REVENUE"
  | "MERCHANT_WITHDRAWN"
  | "BUYER_REFUNDED";

export type LedgerEntryDraft = {
  account: LedgerAccount;
  /** Signed minor units (pesewas). Credits positive, debits negative. */
  amountMinor: number;
};

/**
 * HOLD: buyer funds move into escrow (full gross amount).
 * BUYER_WALLET −amount, ESCROW +amount.
 */
export function recipeHold(amountMinor: number): LedgerEntryDraft[] {
  return [
    { account: "BUYER_WALLET", amountMinor: -amountMinor },
    { account: "ESCROW", amountMinor: amountMinor },
  ];
}

/**
 * RELEASE: escrow splits into merchant net + platform fee.
 * Omits TRUSTPAY_REVENUE when feeMinor === 0.
 */
export function recipeRelease(amountMinor: number, feeMinor: number, netMinor: number): LedgerEntryDraft[] {
  const entries: LedgerEntryDraft[] = [
    { account: "ESCROW", amountMinor: -amountMinor },
    { account: "MERCHANT_AVAILABLE", amountMinor: netMinor },
  ];
  if (feeMinor !== 0) {
    entries.push({ account: "TRUSTPAY_REVENUE", amountMinor: feeMinor });
  }
  return entries;
}

/**
 * REFUND: full gross amount leaves escrow back to buyer (no fee).
 */
export function recipeRefund(amountMinor: number): LedgerEntryDraft[] {
  return [
    { account: "ESCROW", amountMinor: -amountMinor },
    { account: "BUYER_REFUNDED", amountMinor: amountMinor },
  ];
}

/**
 * WITHDRAWAL: merchant available balance moves to withdrawn.
 */
export function recipeWithdrawal(amountMinor: number): LedgerEntryDraft[] {
  return [
    { account: "MERCHANT_AVAILABLE", amountMinor: -amountMinor },
    { account: "MERCHANT_WITHDRAWN", amountMinor: amountMinor },
  ];
}

/** Sum of signed entry amounts; balanced recipes return 0. */
export function netEntries(entries: LedgerEntryDraft[]): number {
  return entries.reduce((sum, e) => sum + e.amountMinor, 0);
}
