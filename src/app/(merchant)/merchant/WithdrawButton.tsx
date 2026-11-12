"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatGhs } from "@/lib/money";

export function WithdrawButton({ availableMinor }: { availableMinor: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("0244000000");
  const [network, setNetwork] = useState("MTN_MOMO");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const amountMinor = Math.round(Number(amount) * 100);
      const res = await fetch("/api/shop/merchant/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMinor, network, phone }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(body.error ?? "Withdrawal failed");
        return;
      }
      toast.success("Withdrawal started");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn btn-primary" type="button" onClick={() => setOpen(true)} disabled={availableMinor <= 0}>
        Withdraw
      </button>
      {open ? (
        <div className="card mt-4 max-w-md">
          <p className="text-sm">Available {formatGhs(availableMinor)}</p>
          <label className="label mt-3" htmlFor="amount">
            Amount (GHS)
          </label>
          <input id="amount" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <label className="label mt-3" htmlFor="network">
            Network
          </label>
          <select id="network" className="input" value={network} onChange={(e) => setNetwork(e.target.value)}>
            <option value="MTN_MOMO">MTN MoMo</option>
            <option value="TELECEL_CASH">Telecel Cash</option>
            <option value="AIRTELTIGO_MONEY">AirtelTigo Money</option>
          </select>
          <label className="label mt-3" htmlFor="phone">
            Phone
          </label>
          <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary" type="button" disabled={busy} onClick={submit}>
              Confirm
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
