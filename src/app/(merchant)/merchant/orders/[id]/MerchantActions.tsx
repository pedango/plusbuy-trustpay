"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MerchantActions({
  orderId,
  canShip,
  canCancel,
}: {
  orderId: string;
  canShip: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(path: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : "{}",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) toast.error(data.error ?? "Failed");
      else {
        toast.success("Updated");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="space-y-4">
      <div className="card">
        <h2 className="section-title">Shop handover</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          The item is already in your shop. Hand it to a rider when you are ready. The buyer can release payment as soon as they have paid.
        </p>
        {canShip ? (
          <div className="mt-4 space-y-3">
            <label className="block" htmlFor="note">
              <span className="label">Delivery note</span>
              <input
                id="note"
                className="input"
                placeholder="e.g. Rider Kwame, collecting now"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <button
              className="btn btn-primary w-full"
              type="button"
              disabled={busy}
              onClick={() => act(`/api/shop/orders/${orderId}/ship`, { deliveryNote: note })}
            >
              Handed to rider
            </button>
          </div>
        ) : null}
        {canCancel ? (
          <button
            className="btn btn-secondary mt-3 w-full"
            type="button"
            disabled={busy}
            onClick={() => act(`/api/shop/orders/${orderId}/cancel`)}
          >
            Cancel and refund
          </button>
        ) : null}
        {!canShip && !canCancel ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No actions for this status.</p>
        ) : null}
      </div>
      <div className="card bg-[var(--shop-accent-tint)]">
        <p className="text-sm font-medium text-[var(--shop-navy)]">Escrow reminder</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          You are paid when the buyer clicks Item received.
        </p>
      </div>
    </aside>
  );
}
