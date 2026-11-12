import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const links: Array<{ href: string; label: string }> = [
  { href: "/merchant", label: "Overview" },
  { href: "/merchant/orders", label: "Orders" },
  { href: "/merchant/ledger", label: "Ledger" },
  { href: "/merchant/payouts", label: "Payouts" },
  { href: "/merchant/products", label: "Products" },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-[var(--border)] bg-white p-4 md:border-b-0 md:border-r">
        <BrandLogo brand="plusbuy" size="sm" />
        <p className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
          Powered by <BrandLogo brand="trustpay" size="sm" />
        </p>
        <nav className="mt-6 flex gap-3 overflow-x-auto md:flex-col">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="container-page py-6">{children}</div>
    </div>
  );
}
