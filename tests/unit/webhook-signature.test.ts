import { describe, expect, it } from "vitest";
import { hmacSha256Hex } from "@/lib/crypto";
import {
  signWebhookPayload,
  verifyWebhookSignature,
} from "@/modules/trustpay/services/webhooks.service";

const secret = "whsec_test";
const body = JSON.stringify({ id: "evt_1", type: "payment.held" });

describe("webhook signature", () => {
  it("accepts a valid signature", () => {
    const now = 1_700_000_000_000;
    const header = signWebhookPayload(secret, body, Math.floor(now / 1000));
    expect(verifyWebhookSignature(body, header, secret, now)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const now = 1_700_000_000_000;
    const header = signWebhookPayload(secret, body, Math.floor(now / 1000));
    expect(verifyWebhookSignature(body + "x", header, secret, now)).toBe(false);
  });

  it("rejects a stale timestamp", () => {
    const signedAt = 1_700_000_000;
    const header = `t=${signedAt},v1=${hmacSha256Hex(secret, `${signedAt}.${body}`)}`;
    expect(verifyWebhookSignature(body, header, secret, (signedAt + 301) * 1000)).toBe(false);
  });
});
