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
}: {
  productId: string;
  name: string;
  priceMinor: number;
  colorHex: string;
  imageUrl?: string | null;
  wide?: boolean;
  pill?: boolean;
}) {
  return (
    <button
      className={wide ? "product-card-cart" : pill ? "landing-add" : "btn btn-primary"}
      type="button"
      onClick={() => {
        const raw = localStorage.getItem("pb_cart");
        const cart = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
        const existing = cart.find((item) => item.productId === productId);
        if (existing && typeof existing.quantity === "number") existing.quantity += 1;
        else cart.push({ productId, name, priceMinor, colorHex, imageUrl: imageUrl ?? null, quantity: 1 });
        localStorage.setItem("pb_cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("pb-cart"));
        toast.success(`${name} added to cart`);
      }}
    >
      {wide || pill ? <ShoppingCart className="h-4 w-4" aria-hidden /> : null}
      Add to cart
    </button>
  );
}
