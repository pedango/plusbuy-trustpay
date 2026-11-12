import { BrandLogo } from "@/components/brand/BrandLogo";

export default function TrustPayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--tp-brand-tint)] text-[var(--tp-brand-dark)]">
      <div className="bg-[var(--tp-brand-dark)] px-4 py-2 text-center text-sm text-white">
        Simulated gateway: no real money moves
      </div>
      <header className="border-b border-white/40 bg-white">
        <div className="container-page flex items-center py-4">
          <BrandLogo brand="trustpay" size="md" />
        </div>
      </header>
      <div className="container-page py-8">{children}</div>
    </div>
  );
}
