import { CheckoutStartSchema } from "@/contracts/trustpay";
import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { startCheckout } from "@/modules/trustpay/services/payments.service";
import { jsonError, jsonOk, requestIdFrom } from "../../../_lib/http";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const { token } = await context.params;
    const input = CheckoutStartSchema.parse(await request.json());
    const ctx = getTrustPayContext();
    const data = await startCheckout(ctx, token, input);
    return jsonOk(requestId, data);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
