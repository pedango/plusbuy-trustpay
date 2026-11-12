import { formatGhs } from "@/lib/money";
import { trustpayClient } from "@/lib/trustpay-client";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const payouts = await trustpayClient.listPayouts().catch(() => []);
  return (
    <div>
      <h1 className="page-title mb-4">Payouts</h1>
      <div className="card">
        {payouts.length === 0 ? <p className="text-sm text-[var(--muted)]">No payouts yet.</p> : null}
        <ul className="divide-y divide-[var(--border)] text-sm">
          {payouts.map((payout) => (
            <li key={payout.id} className="flex justify-between py-3">
              <span>
                {payout.network} · {payout.phone}
              </span>
              <span>
                {formatGhs(payout.amountMinor)} · {payout.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
