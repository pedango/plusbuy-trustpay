"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/shop/SignOutButton";

type SessionUser = { name: string; role: string };

export function SessionMenu({ initial }: { initial: SessionUser | null }) {
  const user = initial;

  if (!user) {
    return (
      <Link href="/login" className="btn btn-primary btn-sm">
        Sign in
      </Link>
    );
  }

  return (
    <>
      <Link href="/orders">Orders</Link>
      {user.role === "MERCHANT" ? <Link href="/merchant">Merchant</Link> : null}
      {user.role === "TRUSTPAY_ADMIN" ? <Link href="/trustpay/admin">TrustPay</Link> : null}
      <span className="hidden text-xs text-[var(--muted)] md:inline">{user.name}</span>
      <SignOutButton />
    </>
  );
}
