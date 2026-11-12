"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shirt } from "lucide-react";
import { toast } from "sonner";

export function ProductEditor({
  product,
}: {
  product: { id: string; name: string; priceLabel: string; colorHex: string; stock: number; active: boolean };
}) {
  const router = useRouter();
  const [stock, setStock] = useState(String(product.stock));
  const [active, setActive] = useState(product.active);
  const [busy, setBusy] = useState(false);

  async function save() {
    const nextStock = Number(stock);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      toast.error("Stock must be a whole number");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/shop/merchant/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, stock: nextStock, active }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Could not save");
        return;
      }
      toast.success("Product saved");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg" style={{ background: product.colorHex }}>
        <Shirt className="text-white" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{product.name}</p>
        <p className="text-sm text-[var(--muted)]">{product.priceLabel}</p>
      </div>
      <label className="text-sm">
        <span className="label">Stock</span>
        <input
          className="input w-24"
          inputMode="numeric"
          value={stock}
          onChange={(event) => setStock(event.target.value)}
          aria-label={`Stock for ${product.name}`}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Listed
      </label>
      <button className="btn btn-primary" type="button" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save"}
      </button>
    </article>
  );
}
