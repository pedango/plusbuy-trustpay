"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatGhs } from "@/lib/money";
import { isValidGhanaPhone, normalizeGhanaPhone } from "@/modules/trustpay/domain/phone";

type CheckoutView = {
  payment: {
    id: string;
    reference: string;
    amountMinor: number;
    status: string;
    returnUrl: string;
  };
  merchantName: string;
};

const NETWORKS = [
  { id: "MTN_MOMO", label: "MTN MoMo", color: "#F5C518" },
  { id: "TELECEL_CASH", label: "Telecel Cash", color: "#E11D48" },
  { id: "AIRTELTIGO_MONEY", label: "AirtelTigo Money", color: "#2563EB" },
] as const;

export default function CheckoutPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [view, setView] = useState<CheckoutView | null>(null);
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]["id"]>("MTN_MOMO");
  const [phone, setPhone] = useState("0244000000");
  const [busy, setBusy] = useState(false);
  const phoneOk = isValidGhanaPhone(phone);
  const warning = phoneOk ? normalizeGhanaPhone(phone, network).softNetworkWarning : undefined;

  useEffect(() => {
    void fetch(`/api/trustpay/v1/checkout/${params.token}`)
      .then((res) => res.json())
      .then((body: { data?: CheckoutView; error?: { message: string } }) => {
        if (!body.data) toast.error(body.error?.message ?? "Checkout not found");
        else setView(body.data);
      });
  }, [params.token]);

  async function pay() {
    setBusy(true);
    try {
      const res = await fetch(`/api/trustpay/v1/checkout/${params.token}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network, phone }),
      });
      const body = (await res.json()) as { error?: { message: string } };
      if (!res.ok) {
        toast.error(body.error?.message ?? "Could not start payment");
        return;
      }
      router.push(`/trustpay/approve/${params.token}`);
    } finally {
      setBusy(false);
    }
  }

  if (!view) return <p>Loading checkout…</p>;

  return (
    <div className="mx-auto max-w-lg card bg-white">
      <p className="label">Pay {view.merchantName}</p>
      <h1 className="page-title mt-2">{formatGhs(view.payment.amountMinor)}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Order {view.payment.reference}</p>
      <p className="mt-4 text-sm">Your money is held safely by TrustPay until you confirm delivery.</p>
      <div className="mt-4 grid gap-2">
        {NETWORKS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`btn btn-secondary justify-start ${network === item.id ? "border-[var(--tp-brand)]" : ""}`}
            onClick={() => setNetwork(item.id)}
          >
            <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: item.color }} />
            {item.label}
          </button>
        ))}
      </div>
      <label className="label mt-4" htmlFor="phone">
        Mobile money number
      </label>
      <input
        id="phone"
        className="input"
        value={phone}
        aria-invalid={!phoneOk}
        onChange={(e) => setPhone(e.target.value)}
      />
      {!phoneOk ? <p className="mt-2 text-sm text-[var(--status-bad-fg)]">Use 0XXXXXXXXX or +233XXXXXXXXX.</p> : null}
      {warning ? <p className="mt-2 text-sm text-[var(--status-held-fg)]">{warning}</p> : null}
      <button className="btn btn-tp mt-4 w-full" type="button" disabled={busy || !phoneOk} onClick={pay}>
        {busy ? "Starting…" : `Pay ${formatGhs(view.payment.amountMinor)}`}
      </button>
    </div>
  );
}
