import { formatGhs } from "@/lib/money";
import { trustpayClient } from "@/lib/trustpay-client";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const ledger = await trustpayClient.listLedger({ limit: 50 }).catch(() => ({ items: [], nextCursor: null }));
  return (
    <div>
      <h1 className="page-title mb-4">Ledger</h1>
      <div className="card">
        {ledger.items.length === 0 ? <p className="text-sm text-[var(--muted)]">No transactions yet.</p> : null}
        <ul className="divide-y divide-[var(--border)] text-sm">
          {ledger.items.map((row) => (
            <li key={row.id} className="flex items-center justify-between py-3">
              <span>
                <Badge>{row.type}</Badge> {row.memo}
              </span>
              <span>{formatGhs(row.amountMinor)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
