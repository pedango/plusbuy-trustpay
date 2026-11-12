import { DisputeRequestSchema } from "@/contracts/trustpay";
import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { openDispute } from "@/modules/trustpay/services/disputes.service";
import { flushWebhooks, jsonError, jsonOk, requestIdFrom, requireMerchant, withIdempotency } from "../../../_lib/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const { id } = await context.params;
    const ctx = getTrustPayContext();
    const merchant = await requireMerchant(request, ctx);
    const body: unknown = await request.json();
    const input = DisputeRequestSchema.parse(body);
    const result = await withIdempotency(
      ctx,
      request,
      merchant.id,
      `/payments/${id}/dispute`,
      input,
      async (tx) => ({ status: 200, data: await openDispute(ctx, id, input.reason, merchant.id, tx) }),
    );
    await flushWebhooks(ctx);
    return jsonOk(requestId, result.data, result.status);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
