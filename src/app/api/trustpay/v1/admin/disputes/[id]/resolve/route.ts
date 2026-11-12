import { z } from "zod";
import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { resolveDispute } from "@/modules/trustpay/services/disputes.service";
import { flushWebhooks, jsonError, jsonOk, requestIdFrom, requireAdmin } from "../../../../_lib/http";

const Body = z.object({ resolution: z.enum(["REFUND", "RELEASE"]) }).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    await requireAdmin();
    const { id } = await context.params;
    const input = Body.parse(await request.json());
    const ctx = getTrustPayContext();
    const data = await resolveDispute(ctx, id, input.resolution);
    await flushWebhooks(ctx);
    return jsonOk(requestId, data);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
