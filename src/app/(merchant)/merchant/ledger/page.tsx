import Link from "next/link";
import { formatGhs } from "@/lib/money";
import { trustpayClient } from "@/lib/trustpay-client";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const ledger = await trustpayClient
    .listLedger({ limit: 50 })
    .catch(() => ({ items: [] as Awaited<ReturnType<typeof trustpayClient.listLedger>>["items"], nextCursor: null }));
  const credits = ledger.items.filter((r) => r.amountMinor > 0).reduce((s, r) => s + r.amountMinor, 0);
  const debits = ledger.items.filter((r) => r.amountMinor < 0).reduce((s, r) => s + Math.abs(r.amountMinor), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Ledger</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Immutable TrustPay entries for your merchant wallet
          </p>
        </div>
        <Link href="/merchant" className="btn btn-secondary btn-sm">
          Back to overview
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="card">
          <p className="label">Entries shown</p>
          <p className="mt-1 text-2xl font-semibold">{ledger.items.length}</p>
        </article>
        <article className="card">
          <p className="label">Credits (sample)</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--status-ok-fg)]">{formatGhs(credits)}</p>
        </article>
        <article className="card">
          <p className="label">Debits (sample)</p>
          <p className="mt-1 text-2xl font-semibold">{formatGhs(debits)}</p>
        </article>
      </div>

      <div className="card overflow-x-auto">
        {ledger.items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No transactions yet. Escrow holds and releases appear here after buyers pay.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                <th className="py-2">Type</th>
                <th>Memo</th>
                <th>When</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledger.items.map((row) => (
                <tr key={row.id} className="border-t border-[var(--border)]">
                  <td className="py-3">
                    <Badge tone={row.amountMinor >= 0 ? "ok" : "held"}>{row.type}</Badge>
                  </td>
                  <td>{row.memo}</td>
                  <td className="text-[var(--muted)]">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="text-right font-medium">{formatGhs(row.amountMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
