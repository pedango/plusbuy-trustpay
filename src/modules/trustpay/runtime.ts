import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { HttpWebhookTransport } from "@/modules/trustpay/adapters/http-webhook-transport";
import { SimulatedMomoProvider } from "@/modules/trustpay/adapters/simulated-momo-provider";
import { createTrustPayContext, type TrustPayContext } from "@/modules/trustpay/context";

/** Default composition root used by TrustPay HTTP routes. */
export function getTrustPayContext(): TrustPayContext {
  return createTrustPayContext({
    db: prisma,
    provider: new SimulatedMomoProvider(),
    transport: new HttpWebhookTransport(),
    logger,
    env: getEnv(),
  });
}
