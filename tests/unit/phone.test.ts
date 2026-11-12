import { describe, expect, it } from "vitest";
import { normalizeGhanaPhone } from "@/modules/trustpay/domain/phone";

describe("phone", () => {
  it("normalizes local to E.164", () => {
    const result = normalizeGhanaPhone("0244000000");
    expect(result.e164).toBe("+233244000000");
    expect(result.national).toBe("0244000000");
    expect(result.hint).toBe("MTN_MOMO");
  });

  it("accepts E.164", () => {
    const result = normalizeGhanaPhone("+233244000000");
    expect(result.national).toBe("0244000000");
  });

  it("soft-warns on network prefix mismatch", () => {
    const result = normalizeGhanaPhone("0244000000", "TELECEL_CASH");
    expect(result.softNetworkWarning).toBeTruthy();
  });

  it("does not warn when the prefix matches", () => {
    const result = normalizeGhanaPhone("0244000000", "MTN_MOMO");
    expect(result.softNetworkWarning).toBeUndefined();
  });

  it("rejects invalid numbers", () => {
    expect(() => normalizeGhanaPhone("123")).toThrow(/Invalid Ghana phone/);
  });
});
