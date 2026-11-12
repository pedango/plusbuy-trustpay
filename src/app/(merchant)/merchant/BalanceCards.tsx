"use client";

import { useEffect, useState } from "react";
import { formatGhs } from "@/lib/money";

type Balance = {
  escrowMinor: number;
  availableMinor: number;
  withdrawnMinor: number;
  feesPaidMinor: number;
  pendingEscrowCount: number;
};

export function BalanceCards({ initial }: { initial: Balance }) {
  const [balance, setBalance] = useState(initial);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch("/api/shop/merchant/balance");
      if (!res.ok) return;
      const body = (await res.json()) as { data: Balance };
      setBalance((prev) => {
        if (prev.availableMinor !== body.data.availableMinor) setFlash("available");
        if (prev.escrowMinor !== body.data.escrowMinor) setFlash("escrow");
        return body.data;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const cards = [
    ["escrow", "Held in escrow", balance.escrowMinor, `${balance.pendingEscrowCount} orders awaiting confirmation`],
    ["available", "Available balance", balance.availableMinor, "Ready to withdraw"],
    ["withdrawn", "Total withdrawn", balance.withdrawnMinor, "Paid out"],
    ["fees", "TrustPay fees paid", balance.feesPaidMinor, "Charged on release"],
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map(([key, label, amount, sub]) => (
        <article key={key} className={`card ${flash === key ? "highlight-flash" : ""}`}>
          <p className="label">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{formatGhs(amount)}</p>
          <p className="text-sm text-[var(--muted)]">{sub}</p>
        </article>
      ))}
    </div>
  );
}
