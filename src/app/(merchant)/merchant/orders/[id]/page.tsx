import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { reconcileOrder } from "@/modules/shop/services/order.service";
import { MerchantActions } from "./MerchantActions";

export const dynamic = "force-dynamic";

function tone(status: string) {
  if (status === "PAID_IN_ESCROW" || status === "DISPUTED") return "held" as const;
  if (status === "COMPLETED") return "ok" as const;
  if (status === "SHIPPED") return "shipped" as const;
  if (status === "PENDING_PAYMENT") return "pending" as const;
  return "neutral" as const;
}

export default async function MerchantOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order = await prisma.order.findUnique({
    where: { id },
    include: { buyer: true, items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  if (order.status === "PENDING_PAYMENT") {
    try {
      await reconcileOrder(order.id);
      order = await prisma.order.findUniqueOrThrow({
        where: { id },
        include: { buyer: true, items: true, events: { orderBy: { createdAt: "asc" } } },
      });
    } catch {
      // Show the stored order if TrustPay is briefly unreachable.
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        <Link href="/merchant/orders" className="underline">
          Orders
        </Link>{" "}
        / {order.code}
      </p>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="card space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="page-title">{order.code}</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Placed {order.createdAt.toLocaleString()}
              </p>
            </div>
            <Badge tone={tone(order.status)}>{order.status.replaceAll("_", " ")}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] px-3 py-3">
              <p className="label">Buyer</p>
              <p className="mt-1 font-medium">{order.buyer.name}</p>
              <p className="text-sm text-[var(--muted)]">{order.buyer.email}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] px-3 py-3">
              <p className="label">Order total</p>
              <p className="mt-1 text-xl font-semibold">{formatGhs(order.totalMinor)}</p>
              <p className="text-sm text-[var(--muted)]">
                {order.items.reduce((sum, i) => sum + i.quantity, 0)} units
              </p>
            </div>
          </div>

          <div>
            <h2 className="section-title">Line items</h2>
            <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="py-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.nameSnapshot} × {item.quantity}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{formatGhs(item.unitPriceMinor)} each</p>
                      {item.quantity < item.orderedQuantity ? (
                        <p className="text-xs text-[var(--muted)]">Ordered {item.orderedQuantity}</p>
                      ) : null}
                    </div>
                    <span className="font-medium">{formatGhs(item.unitPriceMinor * item.quantity)}</span>
                  </div>
                  {item.buyerComment ? <p className="mt-2 text-[var(--muted)]">{item.buyerComment}</p> : null}
                  {item.buyerImageUrl ? (
                    <img src={item.buyerImageUrl} alt="" className="mt-2 h-20 w-20 rounded-lg object-cover" />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="section-title">Timeline</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {order.events.length === 0 ? (
                <li className="text-[var(--muted)]">No events yet.</li>
              ) : (
                order.events.map((event) => (
                  <li key={event.id} className="border-b border-[var(--border)] pb-3 last:border-0">
                    <p className="font-medium">{event.message}</p>
                    <p className="text-[var(--muted)]">
                      {event.actor} · {event.createdAt.toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
        <MerchantActions
          orderId={order.id}
          canShip={order.status === "PAID_IN_ESCROW"}
          canCancel={order.status === "PAID_IN_ESCROW"}
        />
      </div>
    </div>
  );
}
