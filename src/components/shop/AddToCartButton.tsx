"use client";

import { toast } from "sonner";

export function AddToCartButton({
  productId,
  name,
  priceMinor,
  colorHex,
}: {
  productId: string;
  name: string;
  priceMinor: number;
  colorHex: string;
}) {
  return (
    <button
      className="btn btn-primary"
      type="button"
      onClick={() => {
        const raw = localStorage.getItem("pb_cart");
        const cart = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
        const existing = cart.find((item) => item.productId === productId);
        if (existing && typeof existing.quantity === "number") existing.quantity += 1;
        else cart.push({ productId, name, priceMinor, colorHex, quantity: 1 });
        localStorage.setItem("pb_cart", JSON.stringify(cart));
        toast.success(`${name} added to cart`);
      }}
    >
      Add to cart
    </button>
  );
}
