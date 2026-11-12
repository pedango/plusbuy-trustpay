import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { checkLedgerIntegrity } from "@/modules/trustpay/services/ledger-integrity.service";
import { jsonError, jsonOk, requestIdFrom, requireAdmin } from "../../_lib/http";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    await requireAdmin();
    const ctx = getTrustPayContext();
    return jsonOk(requestId, await checkLedgerIntegrity(ctx));
  } catch (error) {
    return jsonError(requestId, error);
  }
}
