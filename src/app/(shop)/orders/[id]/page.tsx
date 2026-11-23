import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { getSession } from "@/lib/session";
import { Badge } from "@/components/ui/Badge";
import { reconcileOrder, syncEscrowToOrderTotal } from "@/modules/shop/services/order.service";
import { OrderActions } from "./OrderActions";
import { OrderItemReview } from "./OrderItemReview";

export const dynamic = "force-dynamic";

function tone(status: string) {
  if (status === "PAID_IN_ESCROW" || status === "DISPUTED") return "held" as const;
  if (status === "COMPLETED") return "ok" as const;
  if (status === "SHIPPED") return "shipped" as const;
  if (status === "PENDING_PAYMENT") return "pending" as const;
  if (status === "REFUNDED" || status === "CANCELLED") return "neutral" as const;
  return "bad" as const;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  let order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } }, buyer: true },
  });
  if (!order) notFound();
  if (session.role === "BUYER" && order.buyerId !== session.sub) notFound();

  if (order.status === "PENDING_PAYMENT") {
    try {
      await reconcileOrder(order.id);
      order = await prisma.order.findUniqueOrThrow({
        where: { id },
        include: { items: true, events: { orderBy: { createdAt: "asc" } }, buyer: true },
      });
    } catch {
      // TrustPay may be briefly unavailable; show the local order.
    }
  }

  if ((order.status === "PAID_IN_ESCROW" || order.status === "SHIPPED") && order.paymentId) {
    try {
      await syncEscrowToOrderTotal(order);
      order = await prisma.order.findUniqueOrThrow({
        where: { id },
        include: { items: true, events: { orderBy: { createdAt: "asc" } }, buyer: true },
      });
    } catch {
      // The buyer can retry the change. Show the order either way.
    }
  }

  const originalMinor = order.items.reduce((sum, item) => sum + item.unitPriceMinor * item.orderedQuantity, 0);
  const returnedMinor = Math.max(0, originalMinor - order.totalMinor);
  const canReview = session.role === "BUYER" && (order.status === "PAID_IN_ESCROW" || order.status === "SHIPPED");

  const stepIndex = order.status === "COMPLETED" ? 1 : order.status === "PAID_IN_ESCROW" || order.status === "SHIPPED" ? 0 : -1;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        <Link href="/orders" className="underline">
          Orders
        </Link>{" "}
        / {order.code}
      </p>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="page-title">{order.code}</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Placed {order.createdAt.toLocaleString()} · {order.items.length} line
                {order.items.length === 1 ? "" : "s"}
              </p>
            </div>
            <Badge tone={tone(order.status)}>
              {order.status === "SHIPPED" ? "WITH RIDER" : order.status.replaceAll("_", " ")}
            </Badge>
          </div>
          <ol className="mt-6 grid gap-2 text-sm md:grid-cols-2">
            {["Paid in escrow", "Item received"].map((label, index) => (
              <li
                key={label}
                className={`rounded-lg border px-3 py-2 ${
                  index <= stepIndex
                    ? "border-[var(--shop-accent)] bg-[var(--shop-accent-tint)]"
                    : "border-[var(--border)]"
                }`}
              >
                <span className="text-xs text-[var(--muted)]">Step {index + 1}</span>
                <p className="font-medium">{label}</p>
              </li>
            ))}
          </ol>
          <OrderItemReview
            orderId={order.id}
            editable={canReview}
            items={order.items.map((item) => ({
              id: item.id,
              name: item.nameSnapshot,
              unitPriceMinor: item.unitPriceMinor,
              quantity: item.quantity,
              orderedQuantity: item.orderedQuantity,
              buyerComment: item.buyerComment,
              buyerImageUrl: item.buyerImageUrl,
            }))}
          />
          <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-3 text-sm">
            <span className="text-[var(--muted)]">Order total</span>
            <span className="text-lg font-semibold">{formatGhs(order.totalMinor)}</span>
          </div>
          {session.role === "BUYER" ? (
            <OrderActions
              orderId={order.id}
              status={order.status}
              amountLabel={formatGhs(order.totalMinor)}
            />
          ) : null}
        </section>
        <aside className="space-y-4">
          {(order.status === "PAID_IN_ESCROW" ||
            order.status === "SHIPPED" ||
            order.status === "DISPUTED") && (
            <div className="card bg-[var(--shop-accent-tint)]">
              <p className="label">Escrow protection</p>
              <p className="mt-2 font-semibold">
                {formatGhs(order.totalMinor)} is held safely by TrustPay
              </p>
              {returnedMinor > 0 ? (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatGhs(returnedMinor)} was returned to you because you kept fewer items.
                </p>
              ) : null}
              <p className="mt-1 text-sm text-[var(--muted)]">
                Click Item received when you have the item. That releases the money to the seller.
              </p>
            </div>
          )}
          <div className="card">
            <p className="label">Buyer</p>
            <p className="mt-2 font-medium">{order.buyer.name}</p>
            <p className="text-sm text-[var(--muted)]">{order.buyer.email}</p>
          </div>
          <div className="card">
            <p className="label">Timeline</p>
            <ul className="mt-3 space-y-3 text-sm">
              {order.events.length === 0 ? (
                <li className="text-[var(--muted)]">No events yet.</li>
              ) : (
                order.events.map((event) => (
                  <li key={event.id}>
                    <p className="font-medium">{event.message}</p>
                    <p className="text-[var(--muted)]">
                      {event.actor} · {event.createdAt.toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
          {session.role === "BUYER" ? (
            <div className="card">
              <p className="label">Rider</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                When the seller hands this order to a rider and shares the trip, you will see where the rider has
                reached.
              </p>
              <iframe
                title="Map of the rider for this order"
                src="https://maps.google.com/maps?q=Accra%2C%20Ghana&hl=en&z=12&output=embed"
                className="mt-3 h-64 w-full rounded-lg border border-[var(--border)]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
