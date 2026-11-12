import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SystemClock } from "@/lib/clock";
import { getEnv, resetEnvCache } from "@/lib/env";
import { logger } from "@/lib/logger";
import { DemoClock } from "@/modules/trustpay/adapters/demo-clock";
import { SimulatedMomoProvider } from "@/modules/trustpay/adapters/simulated-momo-provider";
import { createTrustPayContext } from "@/modules/trustpay/context";
import type { WebhookTransport } from "@/modules/trustpay/ports/webhook-transport";
import { TrustPayError } from "@/modules/trustpay/domain/errors";
import { sha256Hex } from "@/lib/crypto";
import {
  approveCheckout,
  createPayment,
  recordShipment,
  releasePayment,
  startCheckout,
} from "@/modules/trustpay/services/payments.service";
import { openDispute, resolveDispute } from "@/modules/trustpay/services/disputes.service";
import { createPayout } from "@/modules/trustpay/services/payouts.service";
import { runMaintenance } from "@/modules/trustpay/services/maintenance.service";
import { deliverDueWebhooks } from "@/modules/trustpay/services/webhooks.service";
import { newId } from "@/lib/ids";
import { applyTrustPayWebhook } from "@/modules/shop/services/order.service";
import type { WebhookPayload } from "@/contracts/trustpay";

const url = process.env.DATABASE_URL_TEST;
const db = url ? new PrismaClient({ datasources: { db: { url } } }) : null;

const transport: WebhookTransport = {
  async deliver() {
    return { ok: true, status: 200 };
  },
};

function ctx() {
  if (!db) throw new Error("no database");
  resetEnvCache();
  return createTrustPayContext({
    db,
    clock: new DemoClock(db, new SystemClock()),
    provider: new SimulatedMomoProvider(),
    transport,
    logger,
    env: getEnv(),
  });
}

async function merchant() {
  if (!db) throw new Error("no database");
  const id = newId("mer");
  await db.tpMerchant.create({
    data: {
      id,
      name: "Test",
      apiKeyHash: sha256Hex(`tp_test_${id}`),
      webhookUrl: "http://127.0.0.1:9/hook",
      webhookSecret: "whsec_test",
      feeBps: 150,
    },
  });
  await db.tpDemoClock.upsert({
    where: { id: 1 },
    create: { id: 1, offsetSeconds: 0 },
    update: { offsetSeconds: 0 },
  });
  return id;
}

async function heldPayment(merchantId: string, amountMinor = 12_000) {
  const context = ctx();
  const created = await createPayment(context, merchantId, {
    amountMinor,
    reference: newId("pay"),
    returnUrl: "http://localhost:3000/orders/x",
  });
  const row = await db!.tpPayment.findUniqueOrThrow({ where: { id: created.id } });
  await startCheckout(context, row.checkoutToken, { network: "MTN_MOMO", phone: "0244000000" });
  await approveCheckout(context, row.checkoutToken, "1234");
  return created.id;
}

describe("escrow integration", () => {
  let enabled = false;

  beforeAll(async () => {
    if (!db) return;
    try {
      await db.$queryRaw`SELECT 1`;
      enabled = true;
    } catch {
      enabled = false;
    }
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("holds, releases once, and ignores a second release", async () => {
    if (!enabled || !db) return;
    const merchantId = await merchant();
    const paymentId = await heldPayment(merchantId);
    const context = ctx();
    const first = await releasePayment(context, paymentId, merchantId);
    const second = await releasePayment(context, paymentId, merchantId);
    expect(first.status).toBe("RELEASED");
    expect(second.status).toBe("RELEASED");
    const releases = await db.tpLedgerTxn.count({ where: { paymentId, type: "RELEASE" } });
    expect(releases).toBe(1);
  });

  it("allows only one of two concurrent releases", async () => {
    if (!enabled || !db) return;
    const merchantId = await merchant();
    const paymentId = await heldPayment(merchantId);
    const results = await Promise.allSettled([
      releasePayment(ctx(), paymentId, merchantId),
      releasePayment(ctx(), paymentId, merchantId),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await db.tpLedgerTxn.count({ where: { paymentId, type: "RELEASE" } })).toBe(1);
  });

  it("rejects an overdraw race", async () => {
    if (!enabled || !db) return;
    const merchantId = await merchant();
    const paymentId = await heldPayment(merchantId, 10_000);
    await releasePayment(ctx(), paymentId, merchantId);
    const results = await Promise.allSettled([
      createPayout(ctx(), { merchantId, amountMinor: 8_000, network: "MTN_MOMO", phone: "0244000000" }),
      createPayout(ctx(), { merchantId, amountMinor: 8_000, network: "MTN_MOMO", phone: "0244000000" }),
    ]);
    const failed = results.filter((result) => result.status === "rejected");
    expect(failed.length).toBeGreaterThanOrEqual(1);
  });

  it("refunds a dispute and can release a separate dispute", async () => {
    if (!enabled || !db) return;
    const merchantId = await merchant();
    const refundId = await heldPayment(merchantId);
    await openDispute(ctx(), refundId, "Wrong item", merchantId);
    const dispute = await db.tpDispute.findFirstOrThrow({ where: { paymentId: refundId } });
    const refunded = await resolveDispute(ctx(), dispute.id, "REFUND");
    expect(refunded.status).toBe("REFUNDED");

    const releaseId = await heldPayment(merchantId);
    await openDispute(ctx(), releaseId, "Late delivery", merchantId);
    const other = await db.tpDispute.findFirstOrThrow({ where: { paymentId: releaseId } });
    const released = await resolveDispute(ctx(), other.id, "RELEASE");
    expect(released.status).toBe("RELEASED");
  });

  it("auto-releases after the demo clock moves past autoReleaseAt", async () => {
    if (!enabled || !db) return;
    const merchantId = await merchant();
    const paymentId = await heldPayment(merchantId);
    await recordShipment(ctx(), paymentId, merchantId);
    await db.tpPayment.update({
      where: { id: paymentId },
      data: { autoReleaseAt: new Date(Date.now() - 1000) },
    });
    await runMaintenance(ctx());
    const payment = await db.tpPayment.findUniqueOrThrow({ where: { id: paymentId } });
    expect(payment.status).toBe("RELEASED");
  });

  it("retries a failed webhook after the backoff window", async () => {
    if (!enabled || !db) return;
    await db.tpWebhookEvent.updateMany({
      where: { status: "PENDING" },
      data: { nextAttemptAt: new Date(Date.now() + 86_400_000) },
    });
    let attempts = 0;
    const failing = createTrustPayContext({
      db,
      clock: new DemoClock(db, new SystemClock()),
      provider: new SimulatedMomoProvider(),
      transport: {
        async deliver() {
          attempts += 1;
          if (attempts === 1) return { ok: false, status: 500, error: "down" };
          return { ok: true, status: 200 };
        },
      },
      logger,
      env: getEnv(),
    });
    const merchantId = await merchant();
    const paymentId = await heldPayment(merchantId);
    const first = await deliverDueWebhooks(failing);
    expect(first.failed).toBe(1);
    const pending = await db.tpWebhookEvent.findFirstOrThrow({ where: { paymentId, status: "PENDING" } });
    expect(pending.attempts).toBe(1);
    expect(pending.nextAttemptAt.getTime()).toBeGreaterThan(Date.now() + 20_000);
    const early = await deliverDueWebhooks(failing);
    expect(early.delivered + early.failed).toBe(0);
    await db.tpWebhookEvent.update({
      where: { id: pending.id },
      data: { nextAttemptAt: new Date(Date.now() - 1000) },
    });
    const second = await deliverDueWebhooks(failing);
    expect(second.delivered).toBe(1);
    const delivered = await db.tpWebhookEvent.findUniqueOrThrow({ where: { id: pending.id } });
    expect(delivered.status).toBe("DELIVERED");
  });

  it("dedupes shop webhooks and ignores an out-of-order release", async () => {
    if (!enabled || !db) return;
    const buyer = await db.user.create({
      data: {
        email: `${newId("req")}@shop.test`,
        name: "Buyer",
        passwordHash: "x",
        role: "BUYER",
      },
    });
    const paymentId = newId("pay");
    const order = await db.order.create({
      data: {
        code: `PB-${newId("req")}`,
        buyerId: buyer.id,
        status: "PENDING_PAYMENT",
        totalMinor: 12_000,
        paymentId,
      },
    });
    const base = {
      createdAt: new Date().toISOString(),
      data: {
        paymentId,
        reference: order.code,
        status: "HELD" as const,
        amountMinor: 12_000,
        feeMinor: 0,
        netMinor: 12_000,
      },
    };
    const early: WebhookPayload = { ...base, id: newId("evt"), type: "payment.released" };
    const ignored = await applyTrustPayWebhook(early, db);
    expect(ignored.applied).toBe(false);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING_PAYMENT");

    const held: WebhookPayload = { ...base, id: newId("evt"), type: "payment.held" };
    const first = await applyTrustPayWebhook(held, db);
    const replay = await applyTrustPayWebhook(held, db);
    expect(first.applied).toBe(true);
    expect(replay.applied).toBe(false);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID_IN_ESCROW");
  });

  it("rejects an unbalanced ledger transaction and ledger updates", async () => {
    if (!enabled || !db) return;
    const merchantId = await merchant();
    const txnId = newId("txn");
    await expect(
      db.$transaction(async (tx) => {
        await tx.tpLedgerTxn.create({
          data: { id: txnId, merchantId, type: "HOLD", memo: "bad" },
        });
        await tx.tpLedgerEntry.create({
          data: {
            id: newId("ent"),
            txnId,
            merchantId,
            account: "ESCROW",
            amountMinor: 100,
          },
        });
      }),
    ).rejects.toThrow(/not balanced/);

    const paymentId = await heldPayment(merchantId);
    const entry = await db.tpLedgerEntry.findFirstOrThrow({
      where: { merchantId, account: "ESCROW" },
    });
    await expect(
      db.tpLedgerEntry.update({ where: { id: entry.id }, data: { amountMinor: 1 } }),
    ).rejects.toThrow(/immutable/);
    void paymentId;
    void TrustPayError;
  });
});
