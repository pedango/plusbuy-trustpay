"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { readProductImage } from "@/components/shop/readProductImage";

export function ProductEditor({
  product,
}: {
  product: {
    id: string;
    name: string;
    description?: string;
    priceLabel: string;
    colorHex: string;
    imageUrl?: string | null;
    stock: number;
    active: boolean;
  };
}) {
  const router = useRouter();
  const [stock, setStock] = useState(String(product.stock));
  const [active, setActive] = useState(product.active);
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setImageUrl(await readProductImage(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read image");
    }
  }

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
        body: JSON.stringify({
          id: product.id,
          stock: nextStock,
          active,
          ...(imageUrl && imageUrl !== product.imageUrl ? { imageUrl } : {}),
        }),
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
      <ProductMedia
        imageUrl={imageUrl}
        colorHex={product.colorHex}
        name={product.name}
        className="h-16 w-16 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{product.name}</p>
        <p className="text-sm text-[var(--muted)]">{product.priceLabel}</p>
        {product.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{product.description}</p>
        ) : null}
        {product.stock <= 5 ? (
          <p className="mt-1 text-xs font-medium text-[var(--status-held-fg)]">Low stock</p>
        ) : null}
        <label className="mt-2 block text-sm">
          <span className="label">Replace image</span>
          <input
            className="input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </label>
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
