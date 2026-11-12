"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { formatGhs } from "@/lib/money";

export default function ApprovePage() {
  const params = useParams<{ token: string }>();
  const [amount, setAmount] = useState(0);
  const [returnUrl, setReturnUrl] = useState("/");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(`/api/trustpay/v1/checkout/${params.token}`)
      .then((res) => res.json())
      .then((body: { data?: { payment: { amountMinor: number; returnUrl: string } } }) => {
        if (body.data) {
          setAmount(body.data.payment.amountMinor);
          setReturnUrl(body.data.payment.returnUrl);
        }
      });
  }, [params.token]);

  async function approve() {
    setBusy(true);
    try {
      const res = await fetch(`/api/trustpay/v1/checkout/${params.token}/approve`, {
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

  async function cancel() {
    await fetch(`/api/trustpay/v1/checkout/${params.token}/cancel`, { method: "POST" });
    const url = new URL(returnUrl);
    url.searchParams.set("payment", "cancelled");
    window.location.href = url.toString();
  }

  return (
    <div className="mx-auto max-w-sm rounded-3xl border-8 border-[var(--tp-brand-dark)] bg-[#111] p-4 text-white">
      <div className="rounded-2xl bg-[#1a1a1a] p-4">
        <p className="text-xs uppercase tracking-wide text-emerald-300">MoMo approval</p>
        <p className="mt-3 text-sm leading-6">
          Approve payment of {formatGhs(amount)} to PlusBuy via TrustPay Escrow? Enter MoMo PIN
        </p>
        <label className="mt-4 block text-xs" htmlFor="pin">
          PIN
        </label>
        <input
          id="pin"
          inputMode="numeric"
          maxLength={4}
          className="mt-1 w-full rounded bg-black px-3 py-2 tracking-[0.4em]"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <div className="mt-4 flex gap-2">
          <button className="btn btn-tp flex-1" type="button" disabled={busy || pin.length !== 4} onClick={approve}>
            Approve
          </button>
          <button className="btn btn-secondary flex-1" type="button" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
