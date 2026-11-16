import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

function tone(status: string) {
  if (status === "PAID_IN_ESCROW" || status === "DISPUTED") return "held" as const;
  if (status === "COMPLETED") return "ok" as const;
  if (status === "SHIPPED") return "shipped" as const;
  if (status === "PENDING_PAYMENT") return "pending" as const;
  return "neutral" as const;
}

export default async function MerchantOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const status =
    tab === "ship"
      ? "PAID_IN_ESCROW"
      : tab === "transit"
        ? "SHIPPED"
        : tab === "done"
          ? "COMPLETED"
          : tab === "dispute"
            ? "DISPUTED"
            : tab === "refund"
              ? "REFUNDED"
              : undefined;
  const orders = await prisma.order.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: { buyer: true, items: true },
  });
  const tabs = [
    ["all", "All"],
    ["ship", "Ready for rider"],
    ["transit", "With rider"],
    ["done", "Completed"],
    ["dispute", "Disputed"],
    ["refund", "Refunded"],
  ] as const;

  return (
    <div>
      <div className="mb-4">
        <h1 className="page-title">Orders</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{orders.length} in this view</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <Link
            key={id}
            href={id === "all" ? "/merchant/orders" : `/merchant/orders?tab=${id}`}
            className={`btn btn-sm ${(!tab && id === "all") || tab === id ? "btn-primary" : "btn-secondary"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="py-2">Code</th>
              <th>Buyer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Placed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-[var(--border)]">
                <td className="py-3 font-medium">{order.code}</td>
                <td>
                  <p>{order.buyer.name}</p>
                  <p className="text-xs text-[var(--muted)]">{order.buyer.email}</p>
                </td>
                <td className="max-w-48 truncate">
                  {order.items.map((i) => `${i.nameSnapshot} ×${i.quantity}`).join(", ")}
                </td>
                <td>{formatGhs(order.totalMinor)}</td>
                <td>
                  <Badge tone={tone(order.status)}>{order.status.replaceAll("_", " ")}</Badge>
                </td>
                <td className="text-[var(--muted)]">{order.createdAt.toLocaleDateString()}</td>
                <td>
                  <Link href={`/merchant/orders/${order.id}`} className="underline">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? (
          <p className="py-4 text-sm text-[var(--muted)]">Nothing in this tab yet.</p>
        ) : null}
      </div>
    </div>
  );
}
