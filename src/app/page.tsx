import Link from "next/link";
import { Shirt } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function HomePage() {
  return (
    <main className="landing">
      <div className="landing-glow" aria-hidden />
      <div className="landing-grid" aria-hidden />

      <section className="landing-hero">
        <div className="landing-copy">
          <div className="landing-brand animate-rise">
            <BrandLogo brand="plusbuy" size="lg" />
          </div>
          <h1 className="landing-title animate-rise delay-1">Shop more. Pay safe.</h1>
          <p className="landing-lead animate-rise delay-2">
            Your money stays in TrustPay escrow until you confirm the item arrived.
          </p>
          <div className="landing-actions animate-rise delay-3">
            <Link href="/products" className="btn btn-primary">
              Browse shirts
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Sign in
            </Link>
          </div>
        </div>

        <div className="landing-visual animate-rise delay-2" aria-hidden>
          <div className="landing-shirt-plane">
            <div className="landing-shirt-block" style={{ background: "#DC2626" }}>
              <Shirt className="landing-shirt-icon" />
            </div>
            <div className="landing-shirt-block alt" style={{ background: "#2563EB" }}>
              <Shirt className="landing-shirt-icon" />
            </div>
            <div className="landing-shirt-block front" style={{ background: "#022169" }}>
              <Shirt className="landing-shirt-icon" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
