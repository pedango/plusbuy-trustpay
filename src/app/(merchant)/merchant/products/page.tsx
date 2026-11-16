import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { ProductEditor } from "./ProductEditor";
import { ProductCreateForm } from "./ProductCreateForm";

export const dynamic = "force-dynamic";

export default async function MerchantProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  const active = products.filter((p) => p.active).length;
  const lowStock = products.filter((p) => p.stock <= 5).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {products.length} total · {active} listed · {lowStock} low stock
          </p>
        </div>
      </div>
      <ProductCreateForm />
      {products.length === 0 ? (
        <p className="text-[var(--muted)]">No products yet. Add your first product above.</p>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <ProductEditor
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                description: product.description,
                priceLabel: formatGhs(product.priceMinor),
                colorHex: product.colorHex,
                imageUrl: product.imageUrl,
                stock: product.stock,
                active: product.active,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
