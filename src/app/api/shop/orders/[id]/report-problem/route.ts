import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertSameOrigin, authErrorResponse, requireBuyer } from "@/lib/authz";
import { requireSession } from "@/lib/session";
import { trustpayClient } from "@/lib/trustpay-client";
import { transitionOrder } from "@/modules/shop/services/order.service";

const Body = z.object({ reason: z.string().min(3).max(500) }).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    const { id } = await context.params;
    const { reason } = Body.parse(await request.json());
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || !order.paymentId) return Response.json({ error: "Not found" }, { status: 404 });
    requireBuyer(session, order.buyerId);
    if (order.status !== "PAID_IN_ESCROW" && order.status !== "SHIPPED") {
      return Response.json({ error: "This order cannot be disputed" }, { status: 409 });
    }
    await trustpayClient.openDispute(order.paymentId, reason, `dispute_${order.id}`);
    const result = await transitionOrder(order.id, "DISPUTE_OPENED", {
      actor: "buyer",
      message: reason,
    });
    return Response.json({ data: result.order });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Could not open dispute";
    return Response.json({ error: message }, { status: 422 });
  }
}
