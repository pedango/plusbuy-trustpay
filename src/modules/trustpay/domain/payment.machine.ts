export type PaymentStatus =
  | "INITIATED"
  | "AWAITING_APPROVAL"
  | "HELD"
  | "DISPUTED"
  | "RELEASED"
  | "REFUNDED"
  | "FAILED"
  | "EXPIRED";

export type PaymentEvent =
  | "CHECKOUT_STARTED"
  | "EXPIRY_ELAPSED"
  | "APPROVED"
  | "DECLINED"
  | "RELEASE_REQUESTED"
  | "AUTO_RELEASE_DUE"
  | "REFUND_REQUESTED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED_REFUND"
  | "DISPUTE_RESOLVED_RELEASE";

export type GuardContext = {
  now: Date;
  expiresAt: Date;
  autoReleaseAt: Date | null;
};

export type Transition = {
  to: PaymentStatus;
  /** Optional pure guard; if present and returns false, transition is illegal. */
  guard?: (ctx: GuardContext) => boolean;
};

const expired: Transition["guard"] = (ctx) => ctx.now.getTime() >= ctx.expiresAt.getTime();

const autoReleaseDue: Transition["guard"] = (ctx) =>
  ctx.autoReleaseAt !== null && ctx.now.getTime() >= ctx.autoReleaseAt.getTime();

/**
 * Table-driven payment status machine (product brief §7.1).
 * Illegal (from, event) pairs are absent and yield null from getTransition.
 */
const TABLE: Partial<Record<PaymentStatus, Partial<Record<PaymentEvent, Transition>>>> = {
  INITIATED: {
    CHECKOUT_STARTED: { to: "AWAITING_APPROVAL" },
    EXPIRY_ELAPSED: { to: "EXPIRED", guard: expired },
    DECLINED: { to: "FAILED" },
  },
  AWAITING_APPROVAL: {
    APPROVED: { to: "HELD" },
    DECLINED: { to: "FAILED" },
    EXPIRY_ELAPSED: { to: "EXPIRED", guard: expired },
  },
  HELD: {
    RELEASE_REQUESTED: { to: "RELEASED" },
    AUTO_RELEASE_DUE: { to: "RELEASED", guard: autoReleaseDue },
    REFUND_REQUESTED: { to: "REFUNDED" },
    DISPUTE_OPENED: { to: "DISPUTED" },
  },
  DISPUTED: {
    DISPUTE_RESOLVED_REFUND: { to: "REFUNDED" },
    DISPUTE_RESOLVED_RELEASE: { to: "RELEASED" },
  },
};

const STATUSES: PaymentStatus[] = [
  "INITIATED",
  "AWAITING_APPROVAL",
  "HELD",
  "DISPUTED",
  "RELEASED",
  "REFUNDED",
  "FAILED",
  "EXPIRED",
];

const EVENTS: PaymentEvent[] = [
  "CHECKOUT_STARTED",
  "EXPIRY_ELAPSED",
  "APPROVED",
  "DECLINED",
  "RELEASE_REQUESTED",
  "AUTO_RELEASE_DUE",
  "REFUND_REQUESTED",
  "DISPUTE_OPENED",
  "DISPUTE_RESOLVED_REFUND",
  "DISPUTE_RESOLVED_RELEASE",
];

/** Look up a legal payment transition; returns null if the pair is illegal. */
export function getTransition(from: PaymentStatus, event: PaymentEvent): Transition | null {
  return TABLE[from]?.[event] ?? null;
}

export function listPaymentStatuses(): PaymentStatus[] {
  return [...STATUSES];
}

export function listPaymentEvents(): PaymentEvent[] {
  return [...EVENTS];
}

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return (
    status === "RELEASED" ||
    status === "REFUNDED" ||
    status === "FAILED" ||
    status === "EXPIRED"
  );
}
