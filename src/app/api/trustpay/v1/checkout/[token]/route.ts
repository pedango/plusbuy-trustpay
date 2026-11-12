import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { toPaymentDto } from "@/modules/trustpay/services/mappers";
import { getPaymentByCheckoutToken } from "@/modules/trustpay/services/payments.service";
import { jsonError, jsonOk, requestIdFrom } from "../../_lib/http";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    const { token } = await context.params;
    const ctx = getTrustPayContext();
    const payment = await getPaymentByCheckoutToken(ctx, token);
    const merchant = await ctx.db.tpMerchant.findUnique({ where: { id: payment.merchantId } });
    return jsonOk(requestId, {
      payment: { ...toPaymentDto(payment), returnUrl: payment.returnUrl },
      merchantName: merchant?.name ?? "Merchant",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
