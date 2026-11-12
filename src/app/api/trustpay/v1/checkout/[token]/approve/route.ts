import { CheckoutApproveSchema } from "@/contracts/trustpay";
import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { approveCheckout } from "@/modules/trustpay/services/payments.service";
import { flushWebhooks, jsonError, jsonOk, requestIdFrom } from "../../../_lib/http";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const { token } = await context.params;
    const input = CheckoutApproveSchema.parse(await request.json());
    const ctx = getTrustPayContext();
    const data = await approveCheckout(ctx, token, input.pin);
    await flushWebhooks(ctx);
    return jsonOk(requestId, data);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
