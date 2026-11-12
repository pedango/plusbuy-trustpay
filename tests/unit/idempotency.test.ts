import { describe, expect, it } from "vitest";
import { TrustPayError } from "@/modules/trustpay/domain/errors";
import { beginIdempotency, storeIdempotency } from "@/modules/trustpay/services/idempotency.service";

type Row = {
  merchantId: string;
  key: string;
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
  method: string;
  path: string;
};

function memoryStore() {
  const rows: Row[] = [];
  return {
    tpIdempotencyKey: {
      findUnique: async ({ where }: { where: { merchantId_key: { merchantId: string; key: string } } }) =>
        rows.find(
          (row) =>
            row.merchantId === where.merchantId_key.merchantId && row.key === where.merchantId_key.key,
        ) ?? null,
      create: async ({ data }: { data: Row & { id: string } }) => {
        rows.push(data);
        return data;
      },
    },
  };
}

describe("idempotency", () => {
  it("replays the stored response for the same key and body", async () => {
    const db = memoryStore();
    const first = await beginIdempotency(db as never, {
      merchantId: "mer_1",
      key: "k1",
      method: "POST",
      path: "/payments",
      body: { amountMinor: 100 },
    });
    expect(first.replay).toBe(false);
    if (first.replay) return;
    await storeIdempotency(db as never, first, 201, { data: { id: "pay_1" } });

    const second = await beginIdempotency(db as never, {
      merchantId: "mer_1",
      key: "k1",
      method: "POST",
      path: "/payments",
      body: { amountMinor: 100 },
    });
    expect(second.replay).toBe(true);
    if (!second.replay) return;
    expect(second.status).toBe(201);
  });

  it("rejects the same key with a different body", async () => {
    const db = memoryStore();
    const first = await beginIdempotency(db as never, {
      merchantId: "mer_1",
      key: "k1",
      method: "POST",
      path: "/payments",
      body: { amountMinor: 100 },
    });
    if (first.replay) throw new Error("expected fresh key");
    await storeIdempotency(db as never, first, 201, { data: { id: "pay_1" } });

    await expect(
      beginIdempotency(db as never, {
        merchantId: "mer_1",
        key: "k1",
        method: "POST",
        path: "/payments",
        body: { amountMinor: 200 },
      }),
    ).rejects.toBeInstanceOf(TrustPayError);
  });
});
