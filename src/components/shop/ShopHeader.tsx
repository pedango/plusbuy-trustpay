import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SignOutButton } from "@/components/shop/SignOutButton";
import { getSession } from "@/lib/session";

export async function ShopHeader() {
  const session = await getSession();
  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="container-page flex items-center justify-between gap-4 py-4">
        <Link href="/" aria-label="PlusBuy home">
          <BrandLogo brand="plusbuy" size="md" />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/products">Shop</Link>
          <Link href="/cart">Cart</Link>
          {session ? <Link href="/orders">Orders</Link> : null}
          {session?.role === "MERCHANT" ? <Link href="/merchant">Merchant</Link> : null}
          {session?.role === "TRUSTPAY_ADMIN" ? <Link href="/trustpay/admin">TrustPay</Link> : null}
          {session ? (
            <SignOutButton />
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
