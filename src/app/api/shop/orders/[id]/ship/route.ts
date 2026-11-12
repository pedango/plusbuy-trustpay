import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertSameOrigin, authErrorResponse, requireMerchant } from "@/lib/authz";
import { requireSession } from "@/lib/session";
import { trustpayClient } from "@/lib/trustpay-client";
import { transitionOrder } from "@/modules/shop/services/order.service";

const Body = z.object({ deliveryNote: z.string().max(280).optional() }).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    requireMerchant(session);
    const { id } = await context.params;
    const input = Body.parse(await request.json().catch(() => ({})));
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || !order.paymentId) return Response.json({ error: "Not found" }, { status: 404 });
    if (order.status !== "PAID_IN_ESCROW") {
      return Response.json({ error: "Only escrow orders can be shipped" }, { status: 409 });
    }
    await trustpayClient.recordShipment(order.paymentId, `ship_${order.id}`);
    const result = await transitionOrder(order.id, "MERCHANT_SHIPPED", {
      actor: "merchant",
      message: input.deliveryNote?.trim() || "Merchant marked the order as shipped",
      data: { shippedAt: new Date(), deliveryNote: input.deliveryNote ?? null },
    });
    return Response.json({ data: result.order });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Could not ship order";
    return Response.json({ error: message }, { status: 422 });
  }
}
