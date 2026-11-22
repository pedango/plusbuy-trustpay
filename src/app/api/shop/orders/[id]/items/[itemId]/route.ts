import { z, ZodError } from "zod";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { assertSameOrigin, authErrorResponse, requireBuyer } from "@/lib/authz";
import { requireSession } from "@/lib/session";
import { TrustPayError } from "@/lib/trustpay-client";
import { ShopError, syncEscrowToOrderTotal } from "@/modules/shop/services/order.service";

const ImageUrl = z
  .string()
  .max(700_000)
  .refine(
    (value) =>
      value.startsWith("data:image/jpeg;base64,") ||
      value.startsWith("data:image/png;base64,") ||
      value.startsWith("data:image/webp;base64,"),
    "Upload a JPEG, PNG, or WebP image",
  );

const Body = z
  .object({
    quantity: z.number().int().min(0).optional(),
    comment: z.string().max(500).optional(),
    imageUrl: z.union([ImageUrl, z.null()]).optional(),
  })
  .strict();

const EDITABLE = new Set(["PAID_IN_ESCROW", "SHIPPED"]);

export async function POST(request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    const { id, itemId } = await context.params;
    const input = Body.parse(await request.json());
    if (input.quantity === undefined && input.comment === undefined && input.imageUrl === undefined) {
      return Response.json({ error: "Nothing to update" }, { status: 422 });
    }

    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return Response.json({ error: "Not found" }, { status: 404 });
    requireBuyer(session, order.buyerId);
    if (!EDITABLE.has(order.status)) {
      return Response.json(
        { error: "You can only change an order before you click Item received" },
        { status: 409 },
      );
    }
    const item = order.items.find((row) => row.id === itemId);
    if (!item) return Response.json({ error: "Not found" }, { status: 404 });
    if (input.quantity !== undefined && input.quantity > item.quantity) {
      return Response.json({ error: "You can reduce a quantity, not increase it" }, { status: 409 });
    }

    const comment = input.comment === undefined ? undefined : input.comment.trim() || null;
    const requestedQty = input.quantity;
    const qtyDelta = requestedQty === undefined ? 0 : item.quantity - requestedQty;

    if (qtyDelta > 0 || comment !== undefined || input.imageUrl !== undefined) {
      await prisma.$transaction(async (tx) => {
        const freshOrder = await tx.order.findUnique({ where: { id } });
        const freshItem = await tx.orderItem.findUnique({ where: { id: itemId } });
        if (!freshOrder || !freshItem) throw new ShopError("not_found", 404, "Not found");
        if (!EDITABLE.has(freshOrder.status)) {
          throw new ShopError("invalid_transition", 409, "You can only change an order before you click Item received");
        }
        if (requestedQty !== undefined && requestedQty > freshItem.quantity) {
          throw new ShopError("invalid_transition", 409, "You can reduce a quantity, not increase it");
        }
        const appliedDelta = requestedQty === undefined ? 0 : freshItem.quantity - requestedQty;
        const total = freshOrder.totalMinor - freshItem.unitPriceMinor * appliedDelta;
        const bumped = await tx.order.updateMany({
          where: { id, version: freshOrder.version },
          data: {
            version: { increment: 1 },
            ...(appliedDelta > 0 ? { totalMinor: total } : {}),
          },
        });
        if (bumped.count === 0) {
          throw new ShopError("conflict_retry", 409, "Order was updated. Refresh and try again.");
        }
        await tx.orderItem.update({
          where: { id: itemId },
          data: {
            ...(appliedDelta > 0 && requestedQty !== undefined ? { quantity: requestedQty } : {}),
            ...(comment !== undefined ? { buyerComment: comment } : {}),
            ...(input.imageUrl !== undefined ? { buyerImageUrl: input.imageUrl } : {}),
          },
        });
        if (appliedDelta > 0 && requestedQty !== undefined) {
          await tx.product.update({
            where: { id: freshItem.productId },
            data: { stock: { increment: appliedDelta } },
          });
          await tx.orderEvent.create({
            data: {
              orderId: id,
              type: "QUANTITY_REDUCED",
              actor: "buyer",
              message: `Buyer kept ${requestedQty} of ${freshItem.nameSnapshot} instead of ${freshItem.quantity}. Order total is now ${formatGhs(total)}.`,
            },
          });
        }
      });
    }

    const fresh = await prisma.order.findUniqueOrThrow({ where: { id } });
    if (requestedQty !== undefined) await syncEscrowToOrderTotal(fresh);
    return Response.json({ data: { totalMinor: fresh.totalMinor } });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    if (error instanceof ZodError) {
      return Response.json({ error: "Check the comment and photo, then try again" }, { status: 422 });
    }
    if (error instanceof ShopError || error instanceof TrustPayError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not update this item";
    return Response.json({ error: message }, { status: 422 });
  }
}
