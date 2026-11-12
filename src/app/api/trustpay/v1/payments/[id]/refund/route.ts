import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { refundPayment } from "@/modules/trustpay/services/payments.service";
import { flushWebhooks, jsonError, jsonOk, requestIdFrom, requireMerchant, withIdempotency } from "../../../_lib/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const { id } = await context.params;
    const ctx = getTrustPayContext();
    const merchant = await requireMerchant(request, ctx);
    const result = await withIdempotency(
      ctx,
      request,
      merchant.id,
      `/payments/${id}/refund`,
      {},
      async (tx) => ({ status: 200, data: await refundPayment(ctx, id, merchant.id, tx) }),
    );
    await flushWebhooks(ctx);
    return jsonOk(requestId, result.data, result.status);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
