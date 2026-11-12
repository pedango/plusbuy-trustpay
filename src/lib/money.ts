/** Format pesewas (minor units) as Ghanaian cedis. */
export function formatGhs(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const major = Math.floor(abs / 100);
  const cents = abs % 100;
  return `${sign}GH₵ ${major.toLocaleString("en-GH")}.${cents.toString().padStart(2, "0")}`;
}

export const MIN_AMOUNT_MINOR = 100; // GH₵ 1.00
export const MAX_AMOUNT_MINOR = 5_000_000; // GH₵ 50,000.00

export function assertAmountInRange(amountMinor: number): void {
  if (!Number.isInteger(amountMinor) || amountMinor < MIN_AMOUNT_MINOR || amountMinor > MAX_AMOUNT_MINOR) {
    throw Object.assign(new Error("Amount out of range"), { code: "amount_out_of_range" });
  }
}

/**
 * TrustPay fee with half-up rounding:
 * feeMinor = floor((amountMinor * feeBps + 5000) / 10000)
 */
export function computeFee(amountMinor: number, feeBps: number): { feeMinor: number; netMinor: number } {
  const feeMinor = Math.floor((amountMinor * feeBps + 5000) / 10000);
  return { feeMinor, netMinor: amountMinor - feeMinor };
}
