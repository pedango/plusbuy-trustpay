import { describe, expect, it } from "vitest";
import {
  getTransition,
  listPaymentEvents,
  listPaymentStatuses,
  type PaymentEvent,
  type PaymentStatus,
} from "@/modules/trustpay/domain/payment.machine";

const ALLOWED: Array<[PaymentStatus, PaymentEvent, PaymentStatus]> = [
  ["INITIATED", "CHECKOUT_STARTED", "AWAITING_APPROVAL"],
  ["INITIATED", "EXPIRY_ELAPSED", "EXPIRED"],
  ["INITIATED", "DECLINED", "FAILED"],
  ["AWAITING_APPROVAL", "EXPIRY_ELAPSED", "EXPIRED"],
  ["AWAITING_APPROVAL", "APPROVED", "HELD"],
  ["AWAITING_APPROVAL", "DECLINED", "FAILED"],
  ["HELD", "RELEASE_REQUESTED", "RELEASED"],
  ["HELD", "AUTO_RELEASE_DUE", "RELEASED"],
  ["HELD", "REFUND_REQUESTED", "REFUNDED"],
  ["HELD", "DISPUTE_OPENED", "DISPUTED"],
  ["DISPUTED", "DISPUTE_RESOLVED_REFUND", "REFUNDED"],
  ["DISPUTED", "DISPUTE_RESOLVED_RELEASE", "RELEASED"],
];

describe("payment.machine", () => {
  it("allows documented transitions", () => {
    for (const [from, event, to] of ALLOWED) {
      const transition = getTransition(from, event);
      expect(transition, `${from}+${event}`).not.toBeNull();
      expect(transition?.to).toBe(to);
    }
  });

  it("exhaustive matrix: illegal pairs return null", () => {
    const allowed = new Set(ALLOWED.map(([from, event]) => `${from}|${event}`));
    for (const status of listPaymentStatuses()) {
      for (const event of listPaymentEvents()) {
        const key = `${status}|${event}`;
        const transition = getTransition(status, event);
        if (allowed.has(key)) expect(transition).not.toBeNull();
        else expect(transition, key).toBeNull();
      }
    }
  });
});
