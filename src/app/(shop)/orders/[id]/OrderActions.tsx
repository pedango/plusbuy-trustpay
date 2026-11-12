"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal card"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id={titleId} className="section-title">
        {title}
      </h2>
      {children}
    </dialog>
  );
}

export function OrderActions({
  orderId,
  status,
  amountLabel,
}: {
  orderId: string;
  status: string;
  amountLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [problemOpen, setProblemOpen] = useState(false);
  const [displayStatus, setDisplayStatus] = useState(status);

  useEffect(() => {
    setDisplayStatus(status);
  }, [status]);

  async function post(path: string, body?: unknown, optimisticStatus?: string) {
    const previous = displayStatus;
    setBusy(true);
    if (optimisticStatus) setDisplayStatus(optimisticStatus);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDisplayStatus(previous);
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      toast.success("Updated");
      setConfirmOpen(false);
      setProblemOpen(false);
      router.refresh();
    } catch {
      setDisplayStatus(previous);
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {displayStatus === "SHIPPED" ? (
        <>
          <button className="btn btn-primary" type="button" disabled={busy} onClick={() => setConfirmOpen(true)}>
            Item received
          </button>
          <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => setProblemOpen(true)}>
            Report a problem
          </button>
        </>
      ) : null}
      {displayStatus === "PAID_IN_ESCROW" ? (
        <>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={busy}
            onClick={() => post(`/api/shop/orders/${orderId}/cancel`)}
          >
            Cancel order
          </button>
          <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => setProblemOpen(true)}>
            Report a problem
          </button>
        </>
      ) : null}
      {busy && displayStatus === "COMPLETED" ? <p className="text-sm text-[var(--muted)]">Releasing funds…</p> : null}

      <Modal open={confirmOpen} title="Confirm delivery" onClose={() => setConfirmOpen(false)}>
        <p className="mt-2 text-sm">
          Confirm you received the correct item? This releases {amountLabel} to the seller and cannot be undone.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy}
            onClick={() => post(`/api/shop/orders/${orderId}/confirm-delivery`, undefined, "COMPLETED")}
          >
            {busy ? "Releasing…" : "Release funds"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => setConfirmOpen(false)}>
            Back
          </button>
        </div>
      </Modal>

      <Modal open={problemOpen} title="Report a problem" onClose={() => setProblemOpen(false)}>
        <label className="label mt-3" htmlFor="reason">
          What went wrong?
        </label>
        <textarea
          id="reason"
          className="input h-24 py-2"
          value={reason}
          minLength={3}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
        />
        <div className="mt-4 flex gap-2">
          <button
            className="btn btn-danger"
            type="button"
            disabled={busy || reason.trim().length < 3}
            onClick={() => post(`/api/shop/orders/${orderId}/report-problem`, { reason }, "DISPUTED")}
          >
            Freeze funds
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => setProblemOpen(false)}>
            Back
          </button>
        </div>
      </Modal>
    </div>
  );
}
