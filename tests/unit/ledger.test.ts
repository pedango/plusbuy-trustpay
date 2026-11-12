import { describe, expect, it } from "vitest";
import {
  recipeHold,
  recipeRefund,
  recipeRelease,
  recipeWithdrawal,
} from "@/modules/trustpay/domain/ledger";

function sum(entries: { amountMinor: number }[]): number {
  return entries.reduce((total, entry) => total + entry.amountMinor, 0);
}

describe("ledger recipes", () => {
  it("HOLD nets to zero", () => {
    expect(sum(recipeHold(12_000))).toBe(0);
  });

  it("RELEASE nets to zero with fee", () => {
    expect(sum(recipeRelease(12_000, 180, 11_820))).toBe(0);
  });

  it("RELEASE omits revenue when fee is 0", () => {
    const entries = recipeRelease(5_000, 0, 5_000);
    expect(entries.some((entry) => entry.account === "TRUSTPAY_REVENUE")).toBe(false);
    expect(sum(entries)).toBe(0);
  });

  it("REFUND nets to zero", () => {
    expect(sum(recipeRefund(9_000))).toBe(0);
  });

  it("WITHDRAWAL nets to zero", () => {
    expect(sum(recipeWithdrawal(3_000))).toBe(0);
  });
});
