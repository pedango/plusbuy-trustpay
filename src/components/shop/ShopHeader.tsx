import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SessionMenu } from "@/components/shop/SessionMenu";
import { getSession } from "@/lib/session";

export async function ShopHeader() {
  const session = await getSession();
  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="container-page flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="PlusBuy home">
            <BrandLogo brand="plusbuy" size="md" />
          </Link>
          <p className="hidden text-xs text-[var(--muted)] sm:block">Escrow-protected shopping</p>
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-medium">
          <Link href="/products">Shop</Link>
          <Link href="/cart">Cart</Link>
          <SessionMenu
            initial={session ? { name: session.name, role: session.role } : null}
          />
        </nav>
      </div>
    </header>
  );
}
