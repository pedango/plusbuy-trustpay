import type { Prisma, PrismaClient, TpPayment } from "@prisma/client";
import type { WebhookPayload } from "@/contracts/trustpay";
import { newId } from "@/lib/ids";
import type { TrustPayContext } from "@/modules/trustpay/context";
import { TrustPayError } from "@/modules/trustpay/domain/errors";
import { computeFee } from "@/modules/trustpay/domain/fees";
import {
  recipeHold,
  recipeRefund,
  recipeRelease,
  type LedgerEntryDraft,
} from "@/modules/trustpay/domain/ledger";
import {
  getTransition,
  type PaymentEvent,
  type PaymentStatus,
} from "@/modules/trustpay/domain/payment.machine";

export type TransitionExtras = {
  failureReason?: string | null;
  /** Override fee bps; defaults to merchant.feeBps */
  feeBps?: number;
  /** When opening a dispute, create TpDispute in the same transaction. */
  disputeReason?: string;
  /** When resolving, update this dispute id in the same transaction. */
  disputeId?: string;
  disputeResolutionNote?: string;
};

type LedgerWrite = {
  type: "HOLD" | "RELEASE" | "REFUND";
  entries: LedgerEntryDraft[];
  memo: string;
};

type SideEffects = {
  ledger?: LedgerWrite;
  webhookType?: WebhookPayload["type"];
  paymentPatch: Prisma.TpPaymentUpdateManyMutationInput;
};

function buildSideEffects(
  event: PaymentEvent,
  payment: TpPayment,
  now: Date,
  feeBps: number,
  extras?: TransitionExtras,
): SideEffects {
  switch (event) {
    case "APPROVED": {
      return {
        ledger: {
          type: "HOLD",
          entries: recipeHold(payment.amountMinor),
          memo: `Hold ${payment.reference}`,
        },
        webhookType: "payment.held",
        paymentPatch: {
          heldAt: now,
          failureReason: null,
        },
      };
    }
    case "RELEASE_REQUESTED":
    case "AUTO_RELEASE_DUE":
    case "DISPUTE_RESOLVED_RELEASE": {
      const { feeMinor, netMinor } = computeFee(payment.amountMinor, feeBps);
      return {
        ledger: {
          type: "RELEASE",
          entries: recipeRelease(payment.amountMinor, feeMinor, netMinor),
          memo: `Release ${payment.reference}`,
        },
        webhookType: "payment.released",
        paymentPatch: {
          feeMinor,
          netMinor,
          releasedAt: now,
        },
      };
    }
    case "REFUND_REQUESTED":
    case "DISPUTE_RESOLVED_REFUND": {
      return {
        ledger: {
          type: "REFUND",
          entries: recipeRefund(payment.amountMinor),
          memo: `Refund ${payment.reference}`,
        },
        webhookType: "payment.refunded",
        paymentPatch: {
          refundedAt: now,
        },
      };
    }
    case "DISPUTE_OPENED": {
      return {
        webhookType: "payment.disputed",
        paymentPatch: {},
      };
    }
    case "DECLINED": {
      return {
        webhookType: "payment.failed",
        paymentPatch: {
          failureReason: extras?.failureReason ?? "Payment declined",
        },
      };
    }
    case "EXPIRY_ELAPSED": {
      return {
        webhookType: "payment.expired",
        paymentPatch: {
          failureReason: extras?.failureReason ?? "Checkout expired",
        },
      };
    }
    case "CHECKOUT_STARTED": {
      return { paymentPatch: {} };
    }
    default: {
      return { paymentPatch: {} };
    }
  }
}

async function writeLedgerTxn(
  tx: Prisma.TransactionClient,
  payment: TpPayment,
  ledger: LedgerWrite,
): Promise<void> {
  const txnId = newId("txn");
  await tx.tpLedgerTxn.create({
    data: {
      id: txnId,
      merchantId: payment.merchantId,
      paymentId: payment.id,
      type: ledger.type,
      memo: ledger.memo,
      entries: {
        create: ledger.entries.map((e) => ({
          id: newId("ent"),
          merchantId: payment.merchantId,
          account: e.account,
          amountMinor: e.amountMinor,
        })),
      },
    },
  });
}

async function writeOutbox(
  tx: Prisma.TransactionClient,
  payment: TpPayment,
  type: WebhookPayload["type"],
  now: Date,
): Promise<void> {
  const eventId = newId("evt");
  const payload: WebhookPayload = {
    id: eventId,
    type,
    createdAt: now.toISOString(),
    data: {
      paymentId: payment.id,
      reference: payment.reference,
      status: payment.status,
      amountMinor: payment.amountMinor,
      feeMinor: payment.feeMinor,
      netMinor: payment.netMinor,
    },
  };

  await tx.tpWebhookEvent.create({
    data: {
      id: eventId,
      merchantId: payment.merchantId,
      paymentId: payment.id,
      type,
      payload,
      status: "PENDING",
      nextAttemptAt: now,
    },
  });
}

/**
 * Core escrow transition: optimistic version bump + ledger + outbox in one transaction.
 */
export async function transition(
  paymentId: string,
  event: PaymentEvent,
  ctx: TrustPayContext,
  extras?: TransitionExtras,
  tx?: Prisma.TransactionClient,
): Promise<TpPayment> {
  const exec = async (db: Prisma.TransactionClient): Promise<TpPayment> => {
    const payment = await db.tpPayment.findUnique({
      where: { id: paymentId },
      include: { merchant: true },
    });
    if (!payment) {
      throw new TrustPayError("not_found", "Payment not found", { paymentId });
    }

    const from = payment.status as PaymentStatus;
    const transitionDef = getTransition(from, event);
    if (!transitionDef) {
      throw new TrustPayError(
        "invalid_transition",
        `Illegal transition ${from} + ${event}`,
        { paymentId, from, event },
      );
    }

    const now = await ctx.now();
    const guardOk =
      !transitionDef.guard ||
      transitionDef.guard({
        now,
        expiresAt: payment.expiresAt,
        autoReleaseAt: payment.autoReleaseAt,
      });
    if (!guardOk) {
      throw new TrustPayError(
        "invalid_transition",
        `Guard failed for ${from} + ${event}`,
        { paymentId, from, event },
      );
    }

    const feeBps = extras?.feeBps ?? payment.merchant.feeBps;
    const effects = buildSideEffects(event, payment, now, feeBps, extras);

    const updated = await db.tpPayment.updateMany({
      where: { id: paymentId, version: payment.version },
      data: {
        status: transitionDef.to,
        version: { increment: 1 },
        ...effects.paymentPatch,
      },
    });

    if (updated.count === 0) {
      throw new TrustPayError("conflict_retry", "Payment was updated concurrently", {
        paymentId,
      });
    }

    if (effects.ledger) {
      await writeLedgerTxn(db, payment, effects.ledger);
    }

    if (event === "DISPUTE_OPENED") {
      if (!extras?.disputeReason) {
        throw new TrustPayError("validation_error", "Dispute reason is required");
      }
      await db.tpDispute.create({
        data: {
          id: newId("dsp"),
          paymentId,
          reason: extras.disputeReason,
          status: "OPEN",
        },
      });
    }

    if (
      (event === "DISPUTE_RESOLVED_REFUND" || event === "DISPUTE_RESOLVED_RELEASE") &&
      extras?.disputeId
    ) {
      await db.tpDispute.update({
        where: { id: extras.disputeId },
        data: {
          status: event === "DISPUTE_RESOLVED_REFUND" ? "RESOLVED_REFUND" : "RESOLVED_RELEASE",
          resolution:
            extras.disputeResolutionNote ??
            (event === "DISPUTE_RESOLVED_REFUND" ? "REFUND" : "RELEASE"),
          resolvedAt: now,
        },
      });
    }

    const next = await db.tpPayment.findUniqueOrThrow({ where: { id: paymentId } });

    if (effects.webhookType) {
      await writeOutbox(db, next, effects.webhookType, now);
    }

    ctx.logger.info({
      msg: "payment_transition",
      paymentId,
      event,
      from,
      to: next.status,
      merchantId: payment.merchantId,
    });

    return next;
  };

  if (tx) return exec(tx);
  return ctx.db.$transaction((inner) => exec(inner), { maxWait: 10_000, timeout: 20_000 });
}
