import { prisma } from "@/lib/db";
import { assertSameOrigin, authErrorResponse, requireBuyer, requireMerchant } from "@/lib/authz";
import { requireSession } from "@/lib/session";
import { trustpayClient } from "@/lib/trustpay-client";
import { transitionOrder } from "@/modules/shop/services/order.service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    const { id } = await context.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || !order.paymentId) return Response.json({ error: "Not found" }, { status: 404 });
    if (session.role === "MERCHANT") requireMerchant(session);
    else requireBuyer(session, order.buyerId);
    if (order.status !== "PAID_IN_ESCROW" && order.status !== "PENDING_PAYMENT") {
      return Response.json({ error: "Only unpaid or unshipped orders can be cancelled" }, { status: 409 });
    }
    if (order.status === "PAID_IN_ESCROW") {
      await trustpayClient.refundPayment(order.paymentId, `refund_${order.id}`);
    }
    const result = await transitionOrder(order.id, order.status === "PENDING_PAYMENT" ? "PAYMENT_FAILED" : "CANCEL_REQUESTED", {
      actor: session.role === "MERCHANT" ? "merchant" : "buyer",
      message: "Order cancelled",
    });
    return Response.json({ data: result.order });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Could not cancel order";
    return Response.json({ error: message }, { status: 422 });
  }
}
