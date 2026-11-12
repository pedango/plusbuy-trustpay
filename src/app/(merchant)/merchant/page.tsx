import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { trustpayClient } from "@/lib/trustpay-client";
import { Badge } from "@/components/ui/Badge";
import { BalanceCards } from "./BalanceCards";
import { WithdrawButton } from "./WithdrawButton";

export const dynamic = "force-dynamic";

export default async function MerchantHome() {
  let balance = {
    escrowMinor: 0,
    availableMinor: 0,
    withdrawnMinor: 0,
    feesPaidMinor: 0,
    pendingEscrowCount: 0,
    currency: "GHS" as const,
  };
  let ledger: Awaited<ReturnType<typeof trustpayClient.listLedger>>["items"] = [];
  let error: string | null = null;
  try {
    balance = await trustpayClient.getMerchantBalance();
    ledger = (await trustpayClient.listLedger({ limit: 8 })).items;
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load TrustPay";
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { buyer: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="page-title">Merchant</h1>
      {error ? <p className="text-sm text-[var(--status-bad-fg)]">{error}</p> : null}
      <BalanceCards initial={balance} />
      <WithdrawButton availableMinor={balance.availableMinor} />
      <section className="card overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Orders</h2>
          <Link href="/merchant/orders">View all</Link>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-[var(--border)]">
                <td className="py-2">{order.code}</td>
                <td>{order.buyer.name}</td>
                <td>{formatGhs(order.totalMinor)}</td>
                <td>
                  <Badge>{order.status.replaceAll("_", " ")}</Badge>
                </td>
                <td>
                  <Link href={`/merchant/orders/${order.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Ledger</h2>
          <Link href="/merchant/ledger">View all</Link>
        </div>
        {ledger.length === 0 ? <p className="text-sm text-[var(--muted)]">No ledger activity yet.</p> : null}
        <ul className="space-y-2 text-sm">
          {ledger.map((row) => (
            <li key={row.id} className="flex justify-between">
              <span>
                <Badge tone={row.amountMinor >= 0 ? "ok" : "held"}>{row.type}</Badge> {row.memo}
              </span>
              <span>{formatGhs(row.amountMinor)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
