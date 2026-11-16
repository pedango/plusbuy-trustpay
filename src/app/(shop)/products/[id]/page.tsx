import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductMedia } from "@/components/shop/ProductMedia";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.active) notFound();

  const related = await prisma.product.findMany({
    where: { active: true, id: { not: product.id } },
    orderBy: { name: "asc" },
    take: 3,
  });

  return (
    <div className="space-y-8">
      <p className="text-sm text-[var(--muted)]">
        <Link href="/products" className="underline">
          Products
        </Link>{" "}
        / {product.name}
      </p>
      <article className="grid gap-6 md:grid-cols-2">
        <div className="h-full min-h-80 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <ProductMedia
            imageUrl={product.imageUrl}
            colorHex={product.colorHex}
            name={product.name}
            className="h-full min-h-80 w-full"
          />
        </div>
        <div>
          <h1 className="page-title">{product.name}</h1>
          <p className="mt-3 text-[var(--muted)]">{product.description}</p>
          <p className="mt-4 text-3xl font-semibold text-[var(--shop-navy)]">
            {formatGhs(product.priceMinor)}
          </p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] px-3 py-2">
              <dt className="text-[var(--muted)]">Stock</dt>
              <dd className="font-medium">
                {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
              </dd>
            </div>
            <div className="rounded-lg border border-[var(--border)] px-3 py-2">
              <dt className="text-[var(--muted)]">Checkout</dt>
              <dd className="font-medium">TrustPay escrow</dd>
            </div>
          </dl>
          <div className="mt-6">
            <AddToCartButton
              productId={product.id}
              name={product.name}
              priceMinor={product.priceMinor}
              colorHex={product.colorHex}
              imageUrl={product.imageUrl}
            />
          </div>
          <div className="card mt-6 bg-[var(--shop-accent-tint)]">
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--shop-navy)]">
              <ShieldCheck className="h-4 w-4" /> Buyer protection
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Payment is held in TrustPay until you confirm the item arrived. You can open a dispute if
              something goes wrong.
            </p>
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <section>
          <h2 className="section-title">More products</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
