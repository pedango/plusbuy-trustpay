"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export function AddToCartButton({
  productId,
  name,
  priceMinor,
  colorHex,
  imageUrl,
  wide = false,
  pill = false,
  quantity = 1,
  stock,
}: {
  productId: string;
  name: string;
  priceMinor: number;
  colorHex: string;
  imageUrl?: string | null;
  wide?: boolean;
  pill?: boolean;
  quantity?: number;
  stock?: number;
}) {
  return (
    <button
      className={wide ? "product-card-cart" : pill ? "landing-add" : "btn btn-primary"}
      type="button"
      disabled={stock === 0}
      onClick={() => {
        const add = Math.max(1, quantity);
        const raw = localStorage.getItem("pb_cart");
        const cart = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
        const existing = cart.find((item) => item.productId === productId);
        const before = existing && typeof existing.quantity === "number" ? existing.quantity : 0;
        const nextQty = stock != null ? Math.min(stock, before + add) : before + add;
        if (nextQty === before) {
          toast.error(`Only ${stock} in stock`);
          return;
        }
        if (existing && typeof existing.quantity === "number") existing.quantity = nextQty;
        else {
          cart.push({
            productId,
            name,
            priceMinor,
            colorHex,
            imageUrl: imageUrl ?? null,
            quantity: nextQty,
          });
        }
        localStorage.setItem("pb_cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("pb-cart"));
        const added = nextQty - before;
        toast.success(added === 1 ? `${name} added to cart` : `${added} × ${name} added to cart`);
      }}
    >
      {wide || pill ? <ShoppingCart className="h-4 w-4" aria-hidden /> : null}
      Add to cart
    </button>
  );
}
