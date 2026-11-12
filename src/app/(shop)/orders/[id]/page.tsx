import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { getSession } from "@/lib/session";
import { Badge } from "@/components/ui/Badge";
import { trustpayClient } from "@/lib/trustpay-client";
import { reconcileOrder } from "@/modules/shop/services/order.service";
import { OrderActions } from "./OrderActions";

export const dynamic = "force-dynamic";

const STEPS = ["PAID_IN_ESCROW", "SHIPPED", "COMPLETED"] as const;

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

  if (!["COMPLETED", "REFUNDED"].includes(order.status)) {
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

  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  let autoReleaseAt: string | null = null;
  if (order.paymentId && order.status === "SHIPPED") {
    try {
      const payment = await trustpayClient.getPayment(order.paymentId);
      autoReleaseAt = payment.autoReleaseAt ?? null;
    } catch {
      autoReleaseAt = null;
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <section className="card">
        <div className="flex items-center justify-between gap-3">
          <h1 className="page-title">{order.code}</h1>
          <Badge tone={order.status === "COMPLETED" ? "ok" : order.status === "SHIPPED" ? "shipped" : "held"}>
            {order.status.replaceAll("_", " ")}
          </Badge>
        </div>
        <ol className="mt-6 grid gap-2 text-sm md:grid-cols-3">
          {["Paid in escrow", "Shipped", "Received / Released"].map((label, index) => (
            <li
              key={label}
              className={`rounded-lg border px-3 py-2 ${index <= stepIndex ? "border-[var(--shop-accent)] bg-[var(--shop-accent-tint)]" : "border-[var(--border)]"}`}
            >
              {label}
            </li>
          ))}
        </ol>
        <ul className="mt-6 divide-y divide-[var(--border)] text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-2">
              <span>
                {item.nameSnapshot} × {item.quantity}
              </span>
              <span>{formatGhs(item.unitPriceMinor * item.quantity)}</span>
            </li>
          ))}
        </ul>
        {session.role === "BUYER" ? (
          <OrderActions orderId={order.id} status={order.status} amountLabel={formatGhs(order.totalMinor)} />
        ) : null}
      </section>
      <aside className="space-y-4">
        {autoReleaseAt ? (
          <div className="card">
            <p className="label">Auto-release</p>
            <p className="mt-2 text-sm">
              If you do not respond, TrustPay releases the funds on{" "}
              {new Date(autoReleaseAt).toLocaleString()}.
            </p>
          </div>
        ) : null}
        {(order.status === "PAID_IN_ESCROW" || order.status === "SHIPPED" || order.status === "DISPUTED") && (
          <div className="card bg-[var(--shop-accent-tint)]">
            <p className="label">Escrow protection</p>
            <p className="mt-2 font-semibold">{formatGhs(order.totalMinor)} is held safely by TrustPay</p>
          </div>
        )}
        <div className="card">
          <p className="label">Timeline</p>
          <ul className="mt-3 space-y-3 text-sm">
            {order.events.map((event) => (
              <li key={event.id}>
                <p className="font-medium">{event.message}</p>
                <p className="text-[var(--muted)]">
                  {event.actor} · {event.createdAt.toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
