import { prisma } from "@/lib/db";
import { assertSameOrigin, authErrorResponse, requireBuyer } from "@/lib/authz";
import { requireSession } from "@/lib/session";
import { TrustPayError, trustpayClient } from "@/lib/trustpay-client";
import { ShopError, transitionOrder } from "@/modules/shop/services/order.service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    const { id } = await context.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });
    requireBuyer(session, order.buyerId);
    if (order.status !== "SHIPPED" || !order.paymentId) {
      return Response.json({ error: "Item received is only available after shipment" }, { status: 409 });
    }
    await trustpayClient.releasePayment(order.paymentId, `release_${order.id}`);
    const result = await transitionOrder(order.id, "ITEM_RECEIVED", {
      actor: "buyer",
      message: "Buyer confirmed the item was received",
      data: { completedAt: new Date() },
    });
    return Response.json({ data: result.order });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    if (error instanceof ShopError || error instanceof TrustPayError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not confirm delivery";
    return Response.json({ error: message }, { status: 422 });
  }
}
