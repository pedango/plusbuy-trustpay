import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { jsonError, jsonOk, requestIdFrom, requireAdmin } from "../../_lib/http";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    await requireAdmin();
    const ctx = getTrustPayContext();
    const rows = await ctx.db.tpDispute.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { payment: true },
    });
    return jsonOk(
      requestId,
      rows.map((row) => ({
        id: row.id,
        paymentId: row.paymentId,
        reference: row.payment.reference,
        reason: row.reason,
        status: row.status,
        amountMinor: row.payment.amountMinor,
        createdAt: row.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}
