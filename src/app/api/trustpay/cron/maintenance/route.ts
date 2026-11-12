import { timingSafeEqualString } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { runMaintenance } from "@/modules/trustpay/services/maintenance.service";
import { TrustPayError } from "@/modules/trustpay/domain/errors";
import { jsonError, jsonOk, requestIdFrom } from "../../v1/_lib/http";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const header = request.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const secret = getEnv().CRON_SECRET;
    if (!token || token.length !== secret.length || !timingSafeEqualString(token, secret)) {
      throw new TrustPayError("unauthorized", "Invalid cron secret");
    }
    const ctx = getTrustPayContext();
    return jsonOk(requestId, await runMaintenance(ctx));
  } catch (error) {
    return jsonError(requestId, error);
  }
}
