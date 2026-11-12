"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

const DEMO_ACCOUNTS = [
  { label: "Merchant", email: "merchant@plusbuy.demo", password: "Demo@1234" },
  { label: "Buyer (John)", email: "john@plusbuy.demo", password: "Demo@1234" },
  { label: "TrustPay Admin", email: "admin@trustpay.demo", password: "Demo@1234" },
] as const;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(nextEmail: string, nextPassword: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail, password: nextPassword }),
      });
      const data = (await res.json()) as { error?: string; user?: { role: string } };
      if (!res.ok) {
        toast.error(data.error ?? "Login failed");
        return;
      }

      toast.success("Signed in");
      const next = searchParams.get("next");
      if (next && next.startsWith("/")) {
        router.push(next);
        return;
      }
      const role = data.user?.role;
      if (role === "MERCHANT") router.push("/merchant");
      else if (role === "TRUSTPAY_ADMIN") router.push("/trustpay/admin");
      else router.push("/products");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit(email, password);
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="container-page flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandLogo brand="plusbuy" size="lg" />
          <p className="max-w-md text-[var(--muted)]">
            Sign in to shop with escrow-protected checkout powered by TrustPay.
          </p>
        </div>

        <Card className="w-full max-w-md">
          <h1 className="section-title mb-6">Sign in</h1>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size={16} /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <p className="label mb-3">Use demo account</p>
            <div className="flex flex-col gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  variant="secondary"
                  className="w-full justify-between"
                  disabled={loading}
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                    void submit(account.email, account.password);
                  }}
                >
                  <span>{account.label}</span>
                  <span className="text-[var(--muted)] font-normal">{account.email}</span>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
