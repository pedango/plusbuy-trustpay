import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {query
              ? `${products.length} match${products.length === 1 ? "" : "es"} for “${query}”`
              : `${products.length} listed · Escrow-protected checkout via TrustPay`}
          </p>
        </div>
        <Link href="/cart" className="btn btn-secondary btn-sm">
          View cart
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="card">
          <p className="text-[var(--muted)]">
            {query ? `No products match “${query}”.` : "No products yet. Seed the database to load the demo catalog."}
          </p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
