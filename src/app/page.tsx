import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="container-page flex min-h-[70vh] flex-col items-start justify-center gap-6 py-16">
        <BrandLogo brand="plusbuy" size="lg" />
        <h1 className="page-title max-w-xl">Escrow-protected shopping, demo-ready.</h1>
        <p className="max-w-lg text-[var(--muted)]">
          PlusBuy holds payments in TrustPay escrow until you confirm delivery. Explore the catalog
          or sign in with a demo account.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/products" className="btn btn-primary">
            Browse products
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
