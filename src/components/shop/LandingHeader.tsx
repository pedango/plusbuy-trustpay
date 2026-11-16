import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CartLink } from "@/components/shop/CartLink";
import { getSession } from "@/lib/session";

const links = [
  { href: "/#top", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/#about", label: "About" },
  { href: "/#faqs", label: "FAQs" },
  { href: "/#contact", label: "Contact" },
];

export async function LandingHeader() {
  const session = await getSession();
  const accountHref =
    !session
      ? "/login"
      : session.role === "MERCHANT"
        ? "/merchant"
        : session.role === "TRUSTPAY_ADMIN"
          ? "/trustpay/admin"
          : "/orders";

  return (
    <header className="store-header">
      <div className="store-header-inner">
        <Link href="/#top" aria-label="PlusBuy home" className="store-logo">
          <BrandLogo brand="plusbuy" size="md" />
        </Link>
        <nav className="store-nav" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={link.label === "Home" ? "is-active" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <form action="/products" className="store-search" role="search">
          <Search className="h-4 w-4" aria-hidden />
          <input name="q" type="search" placeholder="Search products..." aria-label="Search products" />
        </form>
        <div className="store-tools">
          <Link href={accountHref} className="store-icon" aria-label={session ? session.name : "Sign in"}>
            <UserRound className="h-5 w-5" aria-hidden />
          </Link>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
