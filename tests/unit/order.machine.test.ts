import { describe, expect, it } from "vitest";
import {
  getOrderTransition,
  listOrderEvents,
  listOrderStatuses,
} from "@/modules/shop/domain/order.machine";

const ALLOWED: Array<[string, string, string]> = [
  ["PENDING_PAYMENT", "PAYMENT_HELD", "PAID_IN_ESCROW"],
  ["PENDING_PAYMENT", "PAYMENT_FAILED", "CANCELLED"],
  ["PENDING_PAYMENT", "PAYMENT_EXPIRED", "CANCELLED"],
  ["PAID_IN_ESCROW", "MERCHANT_SHIPPED", "SHIPPED"],
  ["PAID_IN_ESCROW", "CANCEL_REQUESTED", "CANCELLED"],
  ["PAID_IN_ESCROW", "DISPUTE_OPENED", "DISPUTED"],
  ["SHIPPED", "ITEM_RECEIVED", "COMPLETED"],
  ["SHIPPED", "DISPUTE_OPENED", "DISPUTED"],
  ["SHIPPED", "PAYMENT_RELEASED", "COMPLETED"],
  ["DISPUTED", "PAYMENT_RELEASED", "COMPLETED"],
  ["DISPUTED", "PAYMENT_REFUNDED", "REFUNDED"],
  ["CANCELLED", "PAYMENT_REFUNDED", "REFUNDED"],
];

describe("order.machine", () => {
  it("allows exactly the documented transitions", () => {
    for (const [from, event, to] of ALLOWED) {
      const t = getOrderTransition(from as never, event as never);
      expect(t, `${from} + ${event}`).not.toBeNull();
      expect(t?.to).toBe(to);
    }
  });

  it("rejects every other status x event pair", () => {
    const allowedKeys = new Set(ALLOWED.map(([f, e]) => `${f}|${e}`));
    for (const status of listOrderStatuses()) {
      for (const event of listOrderEvents()) {
        const key = `${status}|${event}`;
        if (allowedKeys.has(key)) continue;
        expect(getOrderTransition(status, event), key).toBeNull();
      }
    }
  });
});
