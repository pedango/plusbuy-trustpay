import { notFound } from "next/navigation";
import { Shirt } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { AddToCartButton } from "@/components/shop/AddToCartButton";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.active) notFound();

  return (
    <article className="grid gap-6 md:grid-cols-2">
      <div className="card flex h-80 items-center justify-center" style={{ background: product.colorHex }}>
        <Shirt className="h-16 w-16 text-white" aria-hidden />
      </div>
      <div>
        <h1 className="page-title">{product.name}</h1>
        <p className="mt-3 text-[var(--muted)]">{product.description}</p>
        <p className="mt-4 text-2xl font-semibold">{formatGhs(product.priceMinor)}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{product.stock} in stock</p>
        <div className="mt-6">
          <AddToCartButton
            productId={product.id}
            name={product.name}
            priceMinor={product.priceMinor}
            colorHex={product.colorHex}
          />
        </div>
      </div>
    </article>
  );
}
