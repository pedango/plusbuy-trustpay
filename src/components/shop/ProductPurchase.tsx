"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/shop/AddToCartButton";

export function ProductPurchase({
  productId,
  name,
  priceMinor,
  colorHex,
  imageUrl,
  stock,
}: {
  productId: string;
  name: string;
  priceMinor: number;
  colorHex: string;
  imageUrl?: string | null;
  stock: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const max = Math.max(stock, 0);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2" aria-label="Quantity">
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
          {max === 0 ? 0 : quantity}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          aria-label="Increase quantity"
          disabled={max === 0 || quantity >= max}
          onClick={() => setQuantity((current) => Math.min(max, current + 1))}
        >
          +
        </button>
      </div>
      <AddToCartButton
        productId={productId}
        name={name}
        priceMinor={priceMinor}
        colorHex={colorHex}
        imageUrl={imageUrl}
        quantity={max === 0 ? 0 : quantity}
        stock={stock}
      />
    </div>
  );
}
