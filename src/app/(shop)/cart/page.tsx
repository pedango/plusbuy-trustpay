"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatGhs } from "@/lib/money";

type CartItem = {
  productId: string;
  name: string;
  priceMinor: number;
  quantity: number;
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("pb_cart");
    setItems(raw ? (JSON.parse(raw) as CartItem[]) : []);
  }, []);

  const total = items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0);

  async function checkout() {
    setBusy(true);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const body = (await res.json()) as { error?: string; data?: { checkoutUrl: string } };
      if (!res.ok || !body.data) {
        toast.error(body.error ?? "Checkout failed");
        if (res.status === 401) router.push("/login?next=/cart");
        return;
      }
      localStorage.removeItem("pb_cart");
      window.location.href = body.data.checkoutUrl;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="page-title mb-6">Cart</h1>
      {items.length === 0 ? (
        <p className="text-[var(--muted)]">Your cart is empty. Browse the shop to add a shirt.</p>
      ) : (
        <div className="card max-w-xl">
          <ul className="divide-y divide-[var(--border)]">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between py-3 text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatGhs(item.priceMinor * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-semibold">Total {formatGhs(total)}</p>
          <button className="btn btn-primary mt-4" type="button" disabled={busy} onClick={checkout}>
            {busy ? "Starting checkout…" : "Pay with TrustPay"}
          </button>
        </div>
      )}
    </div>
  );
}
