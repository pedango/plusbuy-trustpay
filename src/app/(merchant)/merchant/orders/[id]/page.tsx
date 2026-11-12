import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { reconcileOrder } from "@/modules/shop/services/order.service";
import { MerchantActions } from "./MerchantActions";

export const dynamic = "force-dynamic";

export default async function MerchantOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order = await prisma.order.findUnique({
    where: { id },
    include: { buyer: true, items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  if (!["COMPLETED", "REFUNDED"].includes(order.status)) {
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
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <section className="card">
        <div className="flex items-center justify-between">
          <h1 className="page-title">{order.code}</h1>
          <Badge>{order.status.replaceAll("_", " ")}</Badge>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {order.buyer.name} · {order.buyer.email}
        </p>
        <p className="mt-2 font-semibold">{formatGhs(order.totalMinor)}</p>
        <ul className="mt-4 divide-y divide-[var(--border)] text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="py-2">
              {item.nameSnapshot} × {item.quantity}
            </li>
          ))}
        </ul>
        <ul className="mt-4 space-y-2 text-sm">
          {order.events.map((event) => (
            <li key={event.id}>
              {event.message} <span className="text-[var(--muted)]">({event.actor})</span>
            </li>
          ))}
        </ul>
      </section>
      <MerchantActions
        orderId={order.id}
        canShip={order.status === "PAID_IN_ESCROW"}
        canCancel={order.status === "PAID_IN_ESCROW"}
      />
    </div>
  );
}
