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
    include: { buyer: true, items: true },
  });

  const open = orders.filter((o) =>
    ["PENDING_PAYMENT", "PAID_IN_ESCROW", "SHIPPED", "DISPUTED"].includes(o.status),
  ).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {orders.length} total · {open} open / awaiting action
          </p>
        </div>
        <Link href="/products" className="btn btn-secondary btn-sm">
          Continue shopping
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="card">
          <p className="text-[var(--muted)]">No orders yet.</p>
          <Link href="/products" className="btn btn-primary mt-4 inline-flex">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <article key={order.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{order.code}</p>
                  <Badge tone={tone(order.status)}>{order.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {order.items.map((i) => `${i.nameSnapshot} × ${i.quantity}`).join(", ")}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Placed {order.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">{formatGhs(order.totalMinor)}</p>
                <Link href={`/orders/${order.id}`} className="btn btn-secondary btn-sm">
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
