import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { getSession } from "@/lib/session";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

function tone(status: string) {
  if (status === "PAID_IN_ESCROW" || status === "DISPUTED") return "held" as const;
  if (status === "COMPLETED") return "ok" as const;
  if (status === "SHIPPED") return "shipped" as const;
  if (status === "PENDING_PAYMENT") return "pending" as const;
  if (status === "REFUNDED" || status === "CANCELLED") return "neutral" as const;
  return "bad" as const;
}

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/orders");
  const orders = await prisma.order.findMany({
    where: session.role === "BUYER" ? { buyerId: session.sub } : {},
    orderBy: { createdAt: "desc" },
    include: { buyer: true },
  });

  return (
    <div>
      <h1 className="page-title mb-6">Orders</h1>
      {orders.length === 0 ? (
        <p className="text-[var(--muted)]">No orders yet.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                <th className="py-2">Code</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[var(--border)]">
                  <td className="py-3">{order.code}</td>
                  <td>{formatGhs(order.totalMinor)}</td>
                  <td>
                    <Badge tone={tone(order.status)}>{order.status.replaceAll("_", " ")}</Badge>
                  </td>
                  <td>
                    <Link href={`/orders/${order.id}`} className="text-[var(--shop-navy)] underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
