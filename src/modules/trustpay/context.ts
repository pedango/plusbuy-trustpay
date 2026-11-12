import type { PrismaClient } from "@prisma/client";
import type { Env } from "@/lib/env";
import type { logger as Logger } from "@/lib/logger";
import { DemoClock } from "@/modules/trustpay/adapters/demo-clock";
import type { MobileMoneyProvider } from "@/modules/trustpay/ports/mobile-money-provider";
import type { WebhookTransport } from "@/modules/trustpay/ports/webhook-transport";

export type TrustPayLogger = typeof Logger;

export type TrustPayContext = {
  db: PrismaClient;
  provider: MobileMoneyProvider;
  transport: WebhookTransport;
  logger: TrustPayLogger;
  env: Env;
  /** Demo-aware clock: wall + TpDemoClock offset. */
  now: () => Promise<Date>;
};

export type CreateTrustPayContextInput = {
  db: PrismaClient;
  clock?: DemoClock;
  provider: MobileMoneyProvider;
  transport: WebhookTransport;
  logger: TrustPayLogger;
  env: Env;
};

export function createTrustPayContext(input: CreateTrustPayContextInput): TrustPayContext {
  const clock = input.clock ?? new DemoClock(input.db);
  return {
    db: input.db,
    provider: input.provider,
    transport: input.transport,
    logger: input.logger,
    env: input.env,
    now: () => clock.nowAsync(),
  };
}
