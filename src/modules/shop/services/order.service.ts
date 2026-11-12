import type { Order, OrderEvent, Prisma } from "@prisma/client";
import {
  getOrderTransition,
  isTerminalOrderStatus,
  type OrderEvent as DomainEvent,
  type OrderStatus,
} from "@/modules/shop/domain/order.machine";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";
import { trustpayClient } from "@/lib/trustpay-client";
import type { WebhookPayload } from "@/contracts/trustpay";

export class ShopError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ShopError";
  }
}

type Actor = "buyer" | "merchant" | "trustpay" | "system";

type TransitionResult = {
  order: Order;
  applied: boolean;
  ignored?: boolean;
};

/**
 * Apply an order domain event via the table-driven machine with optimistic concurrency.
 */
export async function transitionOrder(
  orderId: string,
  event: DomainEvent,
  opts: {
    actor: Actor;
    message: string;
    eventType?: string;
    data?: Prisma.OrderUpdateManyMutationInput;
    tx?: Prisma.TransactionClient;
  },
): Promise<TransitionResult> {
  const run = async (tx: Prisma.TransactionClient): Promise<TransitionResult> => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ShopError("not_found", 404, "Order not found");

    const transition = getOrderTransition(order.status as OrderStatus, event);
    if (!transition) {
      logger.info({
        msg: "order_transition_ignored",
        orderId,
        event,
        status: order.status,
        requestId: getRequestId(),
      });
      return { order, applied: false, ignored: true };
    }

    const updated = await tx.order.updateMany({
      where: { id: orderId, version: order.version },
      data: {
        status: transition.to,
        version: { increment: 1 },
        ...(opts.data ?? {}),
      },
    });

    if (updated.count === 0) {
      throw new ShopError("conflict_retry", 409, "Order was updated concurrently");
    }

    await tx.orderEvent.create({
      data: {
        orderId,
        type: opts.eventType ?? event,
        message: opts.message,
        actor: opts.actor,
      },
    });

    const next = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    logger.info({
      msg: "order_transition",
      orderId,
      event,
      from: order.status,
      to: next.status,
      requestId: getRequestId(),
    });
    return { order: next, applied: true };
  };

  if (opts.tx) return run(opts.tx);
  return prisma.$transaction(run);
}

/** Allocate next PB-#### order code. */
export async function nextOrderCode(tx: Prisma.TransactionClient): Promise<string> {
  const seq = await tx.orderSequence.upsert({
    where: { id: 1 },
    create: { id: 1, nextVal: 1001 },
    update: { nextVal: { increment: 1 } },
  });
  // upsert returns pre-increment for create path carefully:
  const codeNum = seq.nextVal;
  return `PB-${codeNum}`;
}

/**
 * Heal missed webhooks by comparing TrustPay payment status to the local order.
 */
export async function reconcileOrder(orderId: string): Promise<{ changed: boolean }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !order.paymentId) return { changed: false };
  if (isTerminalOrderStatus(order.status as OrderStatus) && order.status !== "CANCELLED") {
    return { changed: false };
  }

  const payment = await trustpayClient.getPayment(order.paymentId);
  let changed = false;

  const map: Array<{ when: boolean; event: DomainEvent; message: string; data?: Prisma.OrderUpdateManyMutationInput }> =
    [
      {
        when: payment.status === "HELD" || payment.status === "DISPUTED" || payment.status === "RELEASED" || payment.status === "REFUNDED",
        event: "PAYMENT_HELD",
        message: "Reconciled: payment held in escrow",
      },
      {
        when: payment.status === "FAILED",
        event: "PAYMENT_FAILED",
        message: "Reconciled: payment failed",
      },
      {
        when: payment.status === "EXPIRED",
        event: "PAYMENT_EXPIRED",
        message: "Reconciled: payment expired",
      },
      {
        when: payment.status === "DISPUTED",
        event: "DISPUTE_OPENED",
        message: "Reconciled: dispute opened",
      },
      {
        when: payment.status === "RELEASED",
        event: "PAYMENT_RELEASED",
        message: "Reconciled: funds released",
        data: { completedAt: new Date() },
      },
      {
        when: payment.status === "REFUNDED",
        event: "PAYMENT_REFUNDED",
        message: "Reconciled: payment refunded",
      },
    ];

  for (const step of map) {
    if (!step.when) continue;
    const result = await transitionOrder(orderId, step.event, {
      actor: "system",
      message: step.message,
      eventType: "RECONCILED",
      data: step.data,
    });
    if (result.applied) changed = true;
  }

  if (changed) {
    await prisma.orderEvent.create({
      data: {
        orderId,
        type: "RECONCILED",
        message: "Order reconciled with TrustPay payment state",
        actor: "system",
      },
    });
  }

  return { changed };
}

const WEBHOOK_EVENT: Partial<Record<WebhookPayload["type"], DomainEvent>> = {
  "payment.held": "PAYMENT_HELD",
  "payment.failed": "PAYMENT_FAILED",
  "payment.expired": "PAYMENT_EXPIRED",
  "payment.released": "PAYMENT_RELEASED",
  "payment.refunded": "PAYMENT_REFUNDED",
  "payment.disputed": "DISPUTE_OPENED",
};

/** Apply a verified TrustPay webhook once. Duplicates and stale events return 200. */
export async function applyTrustPayWebhook(
  payload: WebhookPayload,
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<{ applied: boolean }> {
  const run = async (tx: Prisma.TransactionClient): Promise<{ applied: boolean }> => {
    const existing = await tx.processedWebhook.findUnique({ where: { eventId: payload.id } });
    if (existing) return { applied: false };

    await tx.processedWebhook.create({
      data: { eventId: payload.id, type: payload.type },
    });

    const order =
      (await tx.order.findFirst({ where: { paymentId: payload.data.paymentId } })) ??
      (await tx.order.findUnique({ where: { code: payload.data.reference } }));
    if (!order) return { applied: false };

    const event = WEBHOOK_EVENT[payload.type];
    if (!event) return { applied: false };

    const result = await transitionOrder(order.id, event, {
      actor: "trustpay",
      message: payload.type,
      tx,
      data:
        event === "PAYMENT_RELEASED"
          ? { completedAt: new Date() }
          : event === "MERCHANT_SHIPPED"
            ? { shippedAt: new Date() }
            : undefined,
    });
    return { applied: result.applied };
  };

  if ("$transaction" in db) {
    return db.$transaction((tx) => run(tx));
  }
  return run(db);
}

export async function reconcileStaleOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - 60_000);
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["PENDING_PAYMENT", "PAID_IN_ESCROW", "SHIPPED", "DISPUTED", "CANCELLED"] },
      updatedAt: { lt: cutoff },
      paymentId: { not: null },
    },
    take: 50,
  });
  let changed = 0;
  for (const order of orders) {
    try {
      const result = await reconcileOrder(order.id);
      if (result.changed) changed += 1;
    } catch (error) {
      logger.warn({
        msg: "reconcile_failed",
        orderId: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return changed;
}

export type { OrderEvent };
