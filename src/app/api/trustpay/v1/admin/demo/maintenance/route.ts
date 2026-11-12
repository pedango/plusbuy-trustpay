import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { runMaintenance } from "@/modules/trustpay/services/maintenance.service";
import { jsonError, jsonOk, requestIdFrom, requireAdmin } from "../../../_lib/http";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    await requireAdmin();
    const ctx = getTrustPayContext();
    return jsonOk(requestId, await runMaintenance(ctx));
  } catch (error) {
    return jsonError(requestId, error);
  }
}
