import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { jsonError, jsonOk, requestIdFrom, requireAdmin } from "../../_lib/http";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    await requireAdmin();
    const ctx = getTrustPayContext();
    const rows = await ctx.db.tpWebhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk(
      requestId,
      rows.map((row) => ({
        id: row.id,
        type: row.type,
        status: row.status,
        attempts: row.attempts,
        lastError: row.lastError,
        paymentId: row.paymentId,
        createdAt: row.createdAt.toISOString(),
        deliveredAt: row.deliveredAt?.toISOString() ?? null,
      })),
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}
