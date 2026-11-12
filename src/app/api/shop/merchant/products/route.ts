import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertSameOrigin, authErrorResponse, requireMerchant } from "@/lib/authz";
import { requireSession } from "@/lib/session";

const Body = z
  .object({
    id: z.string().min(1),
    stock: z.number().int().min(0).max(100_000),
    active: z.boolean(),
  })
  .strict();

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    requireMerchant(session);
    const input = Body.parse(await request.json());
    const product = await prisma.product.update({
      where: { id: input.id },
      data: { stock: input.stock, active: input.active },
    });
    return Response.json({
      data: { id: product.id, stock: product.stock, active: product.active },
    });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    return Response.json({ error: "Could not update product" }, { status: 422 });
  }
}
