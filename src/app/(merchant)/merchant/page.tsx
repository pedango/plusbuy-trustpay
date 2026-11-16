import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { trustpayClient } from "@/lib/trustpay-client";
import { Badge } from "@/components/ui/Badge";
import { BalanceCards } from "./BalanceCards";
import { WithdrawButton } from "./WithdrawButton";

export const dynamic = "force-dynamic";

function tone(status: string) {
  if (status === "PAID_IN_ESCROW" || status === "DISPUTED") return "held" as const;
  if (status === "COMPLETED") return "ok" as const;
  if (status === "SHIPPED") return "shipped" as const;
  if (status === "PENDING_PAYMENT") return "pending" as const;
  return "neutral" as const;
}

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

  const shopPromise = Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { buyer: true, items: true },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.order.count({ where: { status: "PAID_IN_ESCROW" } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.order.count({ where: { status: "DISPUTED" } }),
  ]);
  const trustpayPromise = Promise.all([
    trustpayClient.getMerchantBalance(),
    trustpayClient.listLedger({ limit: 8 }),
  ]).catch((err: unknown) => {
    error = err instanceof Error ? err.message : "Could not load TrustPay";
    return null;
  });

  const [[orders, productCount, awaitingShip, inTransit, disputed], trustpay] = await Promise.all([
    shopPromise,
    trustpayPromise,
  ]);
  if (trustpay) {
    balance = trustpay[0];
    ledger = trustpay[1].items;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Merchant dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {productCount} listed products · {awaitingShip} ready for a rider · {inTransit} with a rider
            {disputed ? ` · ${disputed} disputed` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/merchant/products" className="btn btn-secondary btn-sm">
            Manage products
          </Link>
          <Link href="/merchant/orders?tab=ship" className="btn btn-primary btn-sm">
            Hand to rider
          </Link>
        </div>
      </div>

      {error ? (
        <div className="card border-[var(--status-bad-fg)] text-sm text-[var(--status-bad-fg)]">
          TrustPay balances unavailable: {error}
        </div>
      ) : null}

      <BalanceCards initial={balance} />
      <WithdrawButton availableMinor={balance.availableMinor} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card overflow-x-auto">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Recent orders</h2>
            <Link href="/merchant/orders" className="text-sm underline">
              View all
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No orders yet. Share the storefront with buyers.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)]">
                  <th className="py-2">Order</th>
                  <th>Buyer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-[var(--border)]">
                    <td className="py-3">
                      <p className="font-medium">{order.code}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {order.items[0]?.nameSnapshot}
                        {order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
                      </p>
                    </td>
                    <td>
                      <p>{order.buyer.name}</p>
                      <p className="text-xs text-[var(--muted)]">{order.buyer.email}</p>
                    </td>
                    <td>{formatGhs(order.totalMinor)}</td>
                    <td>
                      <Badge tone={tone(order.status)}>{order.status.replaceAll("_", " ")}</Badge>
                    </td>
                    <td>
                      <Link href={`/merchant/orders/${order.id}`} className="underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Ledger</h2>
            <Link href="/merchant/ledger" className="text-sm underline">
              View all
            </Link>
          </div>
          {ledger.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No ledger activity yet. Escrow holds appear after payment.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {ledger.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0">
                  <div>
                    <Badge tone={row.amountMinor >= 0 ? "ok" : "held"}>{row.type}</Badge>
                    <p className="mt-1">{row.memo}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {new Date(row.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-medium">{formatGhs(row.amountMinor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
