import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { computeFee } from "@/lib/money";

describe("fee math", () => {
  it("fee + net === amount and 0 <= fee <= amount (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 5_000_000 }),
        fc.integer({ min: 0, max: 10_000 }),
        (amountMinor, feeBps) => {
          const { feeMinor, netMinor } = computeFee(amountMinor, feeBps);
          expect(feeMinor + netMinor).toBe(amountMinor);
          expect(feeMinor).toBeGreaterThanOrEqual(0);
          expect(feeMinor).toBeLessThanOrEqual(amountMinor);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("rounds half up for 150 bps on 10000 => 150", () => {
    expect(computeFee(10_000, 150)).toEqual({ feeMinor: 150, netMinor: 9850 });
  });
});
