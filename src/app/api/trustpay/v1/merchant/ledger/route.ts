import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { listLedger } from "@/modules/trustpay/services/balances.service";
import { jsonError, jsonOk, requestIdFrom, requireMerchant } from "../../_lib/http";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const ctx = getTrustPayContext();
    const merchant = await requireMerchant(request, ctx);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const data = await listLedger(ctx, merchant.id, {
      limit: Number.isFinite(limit) ? limit : 20,
      cursor,
    });
    return jsonOk(requestId, data);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
