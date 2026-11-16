import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertSameOrigin, authErrorResponse, requireMerchant } from "@/lib/authz";
import { requireSession } from "@/lib/session";

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

const PatchBody = z
  .object({
    id: z.string().min(1),
    stock: z.number().int().min(0).max(100_000),
    active: z.boolean(),
    imageUrl: ImageUrl.optional(),
  })
  .strict();

const CreateBody = z
  .object({
    name: z.string().min(2).max(80),
    description: z.string().min(3).max(500),
    priceGhs: z.number().positive().max(50_000),
    colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    stock: z.number().int().min(0).max(100_000),
    imageUrl: ImageUrl,
  })
  .strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    requireMerchant(session);
    const input = CreateBody.parse(await request.json());
    const priceMinor = Math.round(input.priceGhs * 100);
    const product = await prisma.product.create({
      data: {
        name: input.name.trim(),
        description: input.description.trim(),
        priceMinor,
        colorHex: input.colorHex,
        imageUrl: input.imageUrl,
        stock: input.stock,
        active: true,
      },
    });
    return Response.json({ data: product }, { status: 201 });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Could not create product";
    return Response.json({ error: message }, { status: 422 });
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    requireMerchant(session);
    const input = PatchBody.parse(await request.json());
    const product = await prisma.product.update({
      where: { id: input.id },
      data: {
        stock: input.stock,
        active: input.active,
        ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
      },
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
