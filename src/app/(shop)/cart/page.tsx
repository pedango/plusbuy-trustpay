"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatGhs } from "@/lib/money";

type CartItem = {
  productId: string;
  name: string;
  priceMinor: number;
  quantity: number;
  colorHex?: string;
  imageUrl?: string | null;
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("pb_cart");
    setItems(raw ? (JSON.parse(raw) as CartItem[]) : []);
  }, []);

  function persist(next: CartItem[]) {
    setItems(next);
    localStorage.setItem("pb_cart", JSON.stringify(next));
  }

  const total = items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

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
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <section>
        <h1 className="page-title">Cart</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {count === 0 ? "No items yet" : `${count} item${count === 1 ? "" : "s"} ready for escrow checkout`}
        </p>

        {items.length === 0 ? (
          <div className="card mt-6">
            <p className="text-[var(--muted)]">Your cart is empty.</p>
            <Link href="/products" className="btn btn-primary mt-4 inline-flex">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="card mt-6">
            <ul className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <li key={item.productId} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-lg"
                        style={{ background: item.colorHex ?? "#CBD5E1" }}
                        aria-hidden
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-[var(--muted)]">{formatGhs(item.priceMinor)} each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => {
                          const next = items
                            .map((row) =>
                              row.productId === item.productId
                                ? { ...row, quantity: row.quantity - 1 }
                                : row,
                            )
                            .filter((row) => row.quantity > 0);
                          persist(next);
                        }}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => {
                          persist(
                            items.map((row) =>
                              row.productId === item.productId
                                ? { ...row, quantity: row.quantity + 1 }
                                : row,
                            ),
                          );
                        }}
                      >
                        +
                      </button>
                    </div>
                    <p className="min-w-24 text-right font-medium">
                      {formatGhs(item.priceMinor * item.quantity)}
                    </p>
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => persist(items.filter((row) => row.productId !== item.productId))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <div className="card">
          <h2 className="section-title">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Items</dt>
              <dd>{count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Subtotal</dt>
              <dd className="font-semibold">{formatGhs(total)}</dd>
            </div>
          </dl>
          <button
            className="btn btn-primary mt-5 w-full"
            type="button"
            disabled={busy || items.length === 0}
            onClick={checkout}
          >
            {busy ? "Starting checkout…" : "Pay with TrustPay"}
          </button>
          <p className="mt-3 text-xs text-[var(--muted)]">
            You will approve payment on TrustPay. Funds stay in escrow until you confirm delivery.
          </p>
        </div>
        <div className="card bg-[var(--shop-accent-tint)]">
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--shop-navy)]">
            <ShieldCheck className="h-4 w-4" /> Escrow protection
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            TrustPay holds the money. The merchant only gets paid after you click “Item received”.
          </p>
        </div>
      </aside>
    </div>
  );
}
