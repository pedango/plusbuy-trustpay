import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { getMerchantBalance } from "@/modules/trustpay/services/balances.service";
import { jsonError, jsonOk, requestIdFrom, requireMerchant } from "../../_lib/http";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const ctx = getTrustPayContext();
    const merchant = await requireMerchant(request, ctx);
    return jsonOk(requestId, await getMerchantBalance(ctx, merchant.id));
  } catch (error) {
    return jsonError(requestId, error);
  }
}
