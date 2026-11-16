"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatGhs } from "@/lib/money";

export function MomoPrompt({
  token,
  amountMinor,
  phone,
  networkLabel,
  returnUrl,
}: {
  token: string;
  amountMinor: number;
  phone: string;
  networkLabel: string;
  returnUrl: string;
}) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    try {
      const res = await fetch(`/api/trustpay/v1/checkout/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const body = (await res.json()) as { data?: { status: string }; error?: { message: string } };
      if (!res.ok) {
        toast.error(body.error?.message ?? "Approval failed");
        return;
      }
      const status = body.data?.status === "HELD" ? "held" : "failed";
      const url = new URL(returnUrl);
      url.searchParams.set("payment", status);
      window.location.href = url.toString();
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    try {
      await fetch(`/api/trustpay/v1/checkout/${token}/cancel`, { method: "POST" });
      const url = new URL(returnUrl);
      url.searchParams.set("payment", "cancelled");
      window.location.href = url.toString();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="mb-3 text-center text-sm text-[var(--tp-brand-dark)]">
        Approval prompt sent to <span className="font-semibold">{phone}</span>
      </p>
      <div className="rounded-[2rem] border-8 border-[var(--tp-brand-dark)] bg-[#111] p-3 text-white shadow-xl">
        <div className="mb-2 flex items-center justify-between px-2 text-[10px] text-white/70">
          <span>TrustPay</span>
          <span>now</span>
        </div>
        <div className="rounded-2xl bg-[#1c1c1c] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#F5C518]">{networkLabel}</p>
          <h2 className="mt-3 text-lg font-semibold">Payment request</h2>
          <p className="mt-2 text-sm leading-6 text-white/90">
            Approve <span className="font-semibold">{formatGhs(amountMinor)}</span> to PlusBuy. TrustPay will hold it
            in escrow until you confirm delivery.
          </p>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-white/60">From</dt>
              <dd>{phone}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/60">To</dt>
              <dd>PlusBuy escrow</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-5 text-emerald-300">
            Simulated prompt. No real money leaves this number.
          </p>
          <label className="mt-4 block text-xs text-white/70" htmlFor="momo-pin">
            MoMo PIN
          </label>
          <input
            id="momo-pin"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            className="mt-1 w-full rounded-lg bg-black px-3 py-3 text-center text-lg tracking-[0.5em]"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
          />
          <p className="mt-2 text-[11px] text-white/50">Any 4 digits approve. 0000 declines for low balance. 9999 is a wrong PIN.</p>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-tp flex-1" type="button" disabled={busy || pin.length !== 4} onClick={approve}>
              {busy ? "Sending…" : "Approve"}
            </button>
            <button className="btn btn-secondary flex-1" type="button" disabled={busy} onClick={decline}>
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
