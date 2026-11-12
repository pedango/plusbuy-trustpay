import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { toPaymentDto } from "@/modules/trustpay/services/mappers";
import { jsonError, jsonOk, requestIdFrom, requireAdmin } from "../../_lib/http";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    await requireAdmin();
    const ctx = getTrustPayContext();
    const rows = await ctx.db.tpPayment.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return jsonOk(requestId, rows.map(toPaymentDto));
  } catch (error) {
    return jsonError(requestId, error);
  }
}
