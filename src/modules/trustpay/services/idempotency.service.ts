import type { Prisma } from "@prisma/client";
import { sha256Hex, canonicalJson } from "@/lib/crypto";
import { newId } from "@/lib/ids";
import { TrustPayError } from "@/modules/trustpay/domain/errors";

export type IdempotencyReplay = {
  replay: true;
  status: number;
  body: unknown;
};

export type IdempotencyFresh = {
  replay: false;
  requestHash: string;
  key: string;
  merchantId: string;
  method: string;
  path: string;
};

/**
 * Begin idempotency handling. Same key+hash => replay; same key different hash => error.
 */
export async function beginIdempotency(
  tx: Prisma.TransactionClient | { tpIdempotencyKey: Prisma.TransactionClient["tpIdempotencyKey"] },
  input: {
    merchantId: string;
    key: string;
    method: string;
    path: string;
    body: unknown;
  },
): Promise<IdempotencyReplay | IdempotencyFresh> {
  const requestHash = sha256Hex(canonicalJson(input.body ?? null));
  const existing = await tx.tpIdempotencyKey.findUnique({
    where: {
      merchantId_key: { merchantId: input.merchantId, key: input.key },
    },
  });

  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw new TrustPayError(
        "idempotency_key_reuse",
        "Idempotency key was reused with a different request body",
      );
    }
    return {
      replay: true,
      status: existing.responseStatus,
      body: existing.responseBody,
    };
  }

  return {
    replay: false,
    requestHash,
    key: input.key,
    merchantId: input.merchantId,
    method: input.method,
    path: input.path,
  };
}

/** Persist idempotent response inside the same transaction as the effect when possible. */
export async function storeIdempotency(
  tx: Prisma.TransactionClient | { tpIdempotencyKey: Prisma.TransactionClient["tpIdempotencyKey"] },
  fresh: IdempotencyFresh,
  responseStatus: number,
  responseBody: unknown,
): Promise<void> {
  await tx.tpIdempotencyKey.create({
    data: {
      id: newId("idem"),
      merchantId: fresh.merchantId,
      key: fresh.key,
      method: fresh.method,
      path: fresh.path,
      requestHash: fresh.requestHash,
      responseStatus,
      responseBody: responseBody as Prisma.InputJsonValue,
    },
  });
}
