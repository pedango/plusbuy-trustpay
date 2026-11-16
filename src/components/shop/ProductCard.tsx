import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { ProductMedia } from "@/components/shop/ProductMedia";

export type ProductCardData = {
  id: string;
  name: string;
  priceMinor: number;
  stock: number;
  colorHex: string;
  imageUrl?: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <article className="product-card">
      <Link href={`/products/${product.id}`} className="product-card-media">
        <ProductMedia
          imageUrl={product.imageUrl}
          colorHex={product.colorHex}
          name={product.name}
          fit="contain"
          className="h-full w-full"
        />
      </Link>
      <div className="product-card-body">
        <Link href={`/products/${product.id}`}>
          <h2 className="product-card-name">{product.name}</h2>
        </Link>
        <p className="product-card-meta">
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>
        <p className="product-card-price">{formatGhs(product.priceMinor)}</p>
      </div>
      <AddToCartButton
        wide
        productId={product.id}
        name={product.name}
        priceMinor={product.priceMinor}
        colorHex={product.colorHex}
        imageUrl={product.imageUrl}
      />
    </article>
  );
}
