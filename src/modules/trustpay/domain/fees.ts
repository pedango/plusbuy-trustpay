/**
 * TrustPay platform fee (half-up rounding in integer arithmetic):
 * `feeMinor = floor((amountMinor * feeBps + 5000) / 10000)`,
 * `netMinor = amountMinor - feeMinor`.
 *
 * Fee is taken only on RELEASE (not on HOLD or REFUND).
 */
export { computeFee } from "@/lib/money";
