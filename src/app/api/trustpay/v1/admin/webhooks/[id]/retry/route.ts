import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { retryWebhook } from "@/modules/trustpay/services/webhooks.service";
import { jsonError, jsonOk, requestIdFrom, requireAdmin } from "../../../../_lib/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request);
  try {
    await requireAdmin();
    const { id } = await context.params;
    const ctx = getTrustPayContext();
    const ok = await retryWebhook(ctx, id);
    return jsonOk(requestId, { ok });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
