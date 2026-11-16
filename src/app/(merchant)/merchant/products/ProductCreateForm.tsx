"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { readProductImage } from "@/components/shop/readProductImage";

export function ProductCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceGhs, setPriceGhs] = useState("120");
  const [colorHex, setColorHex] = useState("#2563EB");
  const [stock, setStock] = useState("25");
  const [imageUrl, setImageUrl] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setImageUrl(await readProductImage(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read image");
    }
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/shop/merchant/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          priceGhs: Number(priceGhs),
          colorHex,
          stock: Number(stock),
          imageUrl,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Could not create product");
        return;
      }
      toast.success("Product added");
      setOpen(false);
      setName("");
      setDescription("");
      setImageUrl("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6">
      <button className="btn btn-primary" type="button" onClick={() => setOpen((v) => !v)}>
        {open ? "Cancel" : "Add product"}
      </button>
      {open ? (
        <div className="card mt-4 grid max-w-xl gap-3">
          <h2 className="section-title">New product</h2>
          <label>
            <span className="label">Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span className="label">Description</span>
            <textarea
              className="input h-24 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Product image</span>
            <input
              className="input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
          {imageUrl ? (
            <img src={imageUrl} alt="Product preview" className="h-40 w-full rounded-lg object-cover" />
          ) : (
            <p className="text-sm text-[var(--muted)]">JPEG, PNG, or WebP. Shown on the storefront.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              <span className="label">Price (GHS)</span>
              <input className="input" value={priceGhs} onChange={(e) => setPriceGhs(e.target.value)} />
            </label>
            <label>
              <span className="label">Stock</span>
              <input className="input" value={stock} onChange={(e) => setStock(e.target.value)} />
            </label>
            <label>
              <span className="label">Fallback color</span>
              <input className="input" type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
            </label>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy || name.length < 2 || !imageUrl}
            onClick={submit}
          >
            {busy ? "Saving…" : "Create product"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
