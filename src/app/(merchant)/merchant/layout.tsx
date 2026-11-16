import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SignOutButton } from "@/components/shop/SignOutButton";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const links: Array<{ href: string; label: string }> = [
  { href: "/merchant", label: "Overview" },
  { href: "/merchant/orders", label: "Orders" },
  { href: "/merchant/ledger", label: "Ledger" },
  { href: "/merchant/payouts", label: "Payouts" },
  { href: "/merchant/products", label: "Products" },
];

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[var(--background)] md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-[var(--border)] bg-white p-4 md:min-h-screen md:border-b-0 md:border-r">
        <BrandLogo brand="plusbuy" size="sm" />
        <p className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
          Powered by <BrandLogo brand="trustpay" size="sm" />
        </p>
        {session ? (
          <div className="mt-4 rounded-lg bg-[var(--shop-accent-tint)] px-3 py-2 text-sm">
            <p className="font-medium text-[var(--shop-navy)]">{session.name}</p>
            <p className="text-xs text-[var(--muted)]">{session.email}</p>
          </div>
        ) : null}
        <nav className="mt-6 flex gap-3 overflow-x-auto md:flex-col">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-2 py-1.5 text-sm font-medium hover:bg-[var(--shop-accent-tint)]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/products" className="text-sm text-[var(--muted)] underline">
            View storefront
          </Link>
          <SignOutButton />
        </div>
      </aside>
      <div className="container-page py-6">{children}</div>
    </div>
  );
}
