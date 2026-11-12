import { z } from "zod";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, authErrorResponse } from "@/lib/authz";
import { requireSession } from "@/lib/session";
import { trustpayClient } from "@/lib/trustpay-client";
import { nextOrderCode } from "@/modules/shop/services/order.service";

const Body = z
  .object({
    items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() }).strict()).min(1),
  })
  .strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    if (session.role !== "BUYER") {
      return Response.json({ error: "Only buyers can check out" }, { status: 403 });
    }
    const input = Body.parse(await request.json());

    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: input.items.map((i) => i.productId) }, active: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      let total = 0;
      const lines = input.items.map((item) => {
        const product = byId.get(item.productId);
        if (!product) throw new Error("Unknown product");
        if (product.stock < item.quantity) throw new Error(`${product.name} is out of stock`);
        total += product.priceMinor * item.quantity;
        return { product, quantity: item.quantity };
      });

      const code = await nextOrderCode(tx);
      const created = await tx.order.create({
        data: {
          code,
          buyerId: session.sub,
          status: "PENDING_PAYMENT",
          totalMinor: total,
          currency: "GHS",
          items: {
            create: lines.map((line) => ({
              productId: line.product.id,
              nameSnapshot: line.product.name,
              unitPriceMinor: line.product.priceMinor,
              quantity: line.quantity,
            })),
          },
          events: {
            create: {
              type: "CREATED",
              message: "Order placed, awaiting payment",
              actor: "buyer",
            },
          },
        },
      });

      for (const line of lines) {
        await tx.product.update({
          where: { id: line.product.id },
          data: { stock: { decrement: line.quantity } },
        });
      }
      return created;
    });

    const env = getEnv();
    const payment = await trustpayClient.createPayment(
      {
        amountMinor: order.totalMinor,
        reference: order.code,
        description: `PlusBuy ${order.code}`,
        returnUrl: `${env.APP_URL}/orders/${order.id}?payment=return`,
      },
      `order_${order.id}_create`,
    );

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: payment.id, checkoutUrl: payment.checkoutUrl },
    });

    return Response.json({ data: { orderId: order.id, checkoutUrl: payment.checkoutUrl, code: order.code } });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Could not place order";
    return Response.json({ error: message }, { status: 422 });
  }
}
