import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { cancelCheckout } from "@/modules/trustpay/services/payments.service";
import { flushWebhooks, jsonError, jsonOk, requestIdFrom } from "../../../_lib/http";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const { token } = await context.params;
    const ctx = getTrustPayContext();
    const data = await cancelCheckout(ctx, token);
    await flushWebhooks(ctx);
    return jsonOk(requestId, data);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
