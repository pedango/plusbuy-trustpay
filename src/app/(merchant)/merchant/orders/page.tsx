import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function MerchantOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const status =
    tab === "ship" ? "PAID_IN_ESCROW" : tab === "transit" ? "SHIPPED" : tab === "done" ? "COMPLETED" : tab === "dispute" ? "DISPUTED" : tab === "refund" ? "REFUNDED" : undefined;
  const orders = await prisma.order.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: { buyer: true },
  });
  const tabs = [
    ["all", "All"],
    ["ship", "Awaiting shipment"],
    ["transit", "In transit"],
    ["done", "Completed"],
    ["dispute", "Disputed"],
    ["refund", "Refunded"],
  ];

  return (
    <div>
      <h1 className="page-title mb-4">Orders</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <Link key={id} href={id === "all" ? "/merchant/orders" : `/merchant/orders?tab=${id}`} className="btn btn-secondary btn-sm">
            {label}
          </Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
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
                  <Link href={`/merchant/orders/${order.id}`}>Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? <p className="py-4 text-sm text-[var(--muted)]">Nothing in this tab yet.</p> : null}
      </div>
    </div>
  );
}
