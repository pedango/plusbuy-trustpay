import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { getPayment } from "@/modules/trustpay/services/payments.service";
import { jsonError, jsonOk, requestIdFrom, requireMerchant } from "../../_lib/http";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const { id } = await context.params;
    const ctx = getTrustPayContext();
    const merchant = await requireMerchant(request, ctx);
    const data = await getPayment(ctx, id, merchant.id);
    return jsonOk(requestId, data);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
