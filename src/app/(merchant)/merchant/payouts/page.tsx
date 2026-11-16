import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { trustpayClient } from "@/lib/trustpay-client";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

function tone(status: string) {
  if (status === "PAID") return "ok" as const;
  if (status === "PROCESSING") return "pending" as const;
  if (status === "FAILED") return "bad" as const;
  return "neutral" as const;
}

export default async function PayoutsPage() {
  const payouts = await trustpayClient.listPayouts().catch(() => []);
  const total = payouts.reduce((sum, p) => sum + p.amountMinor, 0);
  const succeeded = payouts.filter((p) => p.status === "PAID").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Payouts</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Mobile money withdrawals from your available TrustPay balance
          </p>
        </div>
        <Link href="/merchant" className="btn btn-primary btn-sm">
          Withdraw from overview
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="card">
          <p className="label">Payouts</p>
          <p className="mt-1 text-2xl font-semibold">{payouts.length}</p>
        </article>
        <article className="card">
          <p className="label">Succeeded</p>
          <p className="mt-1 text-2xl font-semibold">{succeeded}</p>
        </article>
        <article className="card">
          <p className="label">Total volume</p>
          <p className="mt-1 text-2xl font-semibold">{formatGhs(total)}</p>
        </article>
      </div>

      <div className="card overflow-x-auto">
        {payouts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No payouts yet. Use Withdraw on the overview once escrow releases funds to available.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                <th className="py-2">Network</th>
                <th>Phone</th>
                <th>Status</th>
                <th>When</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-t border-[var(--border)]">
                  <td className="py-3 font-medium">{payout.network}</td>
                  <td>{payout.phone}</td>
                  <td>
                    <Badge tone={tone(payout.status)}>{payout.status}</Badge>
                  </td>
                  <td className="text-[var(--muted)]">
                    {new Date(payout.createdAt).toLocaleString()}
                  </td>
                  <td className="text-right font-medium">{formatGhs(payout.amountMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
