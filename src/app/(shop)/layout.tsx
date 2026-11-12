import { ShopHeader } from "@/components/shop/ShopHeader";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ShopHeader />
      <div className="container-page py-6">{children}</div>
    </div>
  );
}
