"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MerchantActions({ orderId, canShip, canCancel }: { orderId: string; canShip: boolean; canCancel: boolean }) {
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
    <div className="card">
      {canShip ? (
        <>
          <label className="label" htmlFor="note">
            Delivery note
          </label>
          <input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          <button
            className="btn btn-primary mt-4"
            type="button"
            disabled={busy}
            onClick={() => act(`/api/shop/orders/${orderId}/ship`, { deliveryNote: note })}
          >
            Mark as shipped
          </button>
        </>
      ) : null}
      {canCancel ? (
        <button
          className="btn btn-secondary mt-3"
          type="button"
          disabled={busy}
          onClick={() => act(`/api/shop/orders/${orderId}/cancel`)}
        >
          Cancel and refund
        </button>
      ) : null}
      {!canShip && !canCancel ? <p className="text-sm text-[var(--muted)]">No actions for this status.</p> : null}
    </div>
  );
}
