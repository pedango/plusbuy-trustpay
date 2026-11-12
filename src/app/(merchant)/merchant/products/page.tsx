import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { ProductEditor } from "./ProductEditor";

export const dynamic = "force-dynamic";

export default async function MerchantProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="page-title mb-4">Products</h1>
      <div className="grid gap-4">
        {products.map((product) => (
          <ProductEditor
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              priceLabel: formatGhs(product.priceMinor),
              colorHex: product.colorHex,
              stock: product.stock,
              active: product.active,
            }}
          />
        ))}
      </div>
    </div>
  );
}
