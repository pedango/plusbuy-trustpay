import Link from "next/link";
import { Shirt } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { AddToCartButton } from "@/components/shop/AddToCartButton";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="page-title mb-6">Shirts</h1>
      {products.length === 0 ? (
        <p className="text-[var(--muted)]">No products yet. Seed the database to load the demo catalog.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="card flex flex-col gap-3">
              <Link href={`/products/${product.id}`} className="block">
                <div
                  className="flex h-40 items-center justify-center rounded-lg"
                  style={{ background: product.colorHex }}
                >
                  <Shirt className="h-10 w-10 text-white drop-shadow" aria-hidden />
                </div>
                <h2 className="mt-3 text-lg font-semibold">{product.name}</h2>
                <p className="text-sm text-[var(--muted)]">{product.description}</p>
                <p className="mt-2 font-semibold">{formatGhs(product.priceMinor)}</p>
              </Link>
              <AddToCartButton
                productId={product.id}
                name={product.name}
                priceMinor={product.priceMinor}
                colorHex={product.colorHex}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
