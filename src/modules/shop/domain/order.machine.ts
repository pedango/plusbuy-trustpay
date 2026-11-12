export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID_IN_ESCROW"
  | "SHIPPED"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED"
  | "CANCELLED";

export type OrderEvent =
  | "PAYMENT_HELD"
  | "PAYMENT_FAILED"
  | "PAYMENT_EXPIRED"
  | "MERCHANT_SHIPPED"
  | "CANCEL_REQUESTED"
  | "ITEM_RECEIVED"
  | "DISPUTE_OPENED"
  | "PAYMENT_RELEASED"
  | "PAYMENT_REFUNDED";

type Transition = {
  to: OrderStatus;
  /** If true, status may stay while waiting for webhook confirmation */
  note?: string;
};

const TABLE: Partial<Record<OrderStatus, Partial<Record<OrderEvent, Transition>>>> = {
  PENDING_PAYMENT: {
    PAYMENT_HELD: { to: "PAID_IN_ESCROW" },
    PAYMENT_FAILED: { to: "CANCELLED" },
    PAYMENT_EXPIRED: { to: "CANCELLED" },
  },
  PAID_IN_ESCROW: {
    MERCHANT_SHIPPED: { to: "SHIPPED" },
    CANCEL_REQUESTED: { to: "CANCELLED", note: "await payment.refunded" },
    DISPUTE_OPENED: { to: "DISPUTED" },
  },
  SHIPPED: {
    ITEM_RECEIVED: { to: "COMPLETED" },
    DISPUTE_OPENED: { to: "DISPUTED" },
    PAYMENT_RELEASED: { to: "COMPLETED" },
  },
  DISPUTED: {
    PAYMENT_RELEASED: { to: "COMPLETED" },
    PAYMENT_REFUNDED: { to: "REFUNDED" },
  },
  CANCELLED: {
    PAYMENT_REFUNDED: { to: "REFUNDED" },
  },
};

const STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID_IN_ESCROW",
  "SHIPPED",
  "COMPLETED",
  "DISPUTED",
  "REFUNDED",
  "CANCELLED",
];

const EVENTS: OrderEvent[] = [
  "PAYMENT_HELD",
  "PAYMENT_FAILED",
  "PAYMENT_EXPIRED",
  "MERCHANT_SHIPPED",
  "CANCEL_REQUESTED",
  "ITEM_RECEIVED",
  "DISPUTE_OPENED",
  "PAYMENT_RELEASED",
  "PAYMENT_REFUNDED",
];

/** Look up a legal order transition; returns null if illegal. */
export function getOrderTransition(
  from: OrderStatus,
  event: OrderEvent,
): Transition | null {
  return TABLE[from]?.[event] ?? null;
}

export function listOrderStatuses(): OrderStatus[] {
  return [...STATUSES];
}

export function listOrderEvents(): OrderEvent[] {
  return [...EVENTS];
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === "COMPLETED" || status === "REFUNDED" || status === "CANCELLED";
}
