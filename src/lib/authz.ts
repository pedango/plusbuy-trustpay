import { NextResponse } from "next/server";
import type { SessionPayload } from "@/lib/session";
import { AuthError } from "@/lib/session";
import { getEnv } from "@/lib/env";

export class AuthzError extends Error {
  readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "BAD_ORIGIN";
  readonly status: number;

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN" | "BAD_ORIGIN", message: string) {
    super(message);
    this.name = "AuthzError";
    this.code = code;
    this.status = code === "UNAUTHORIZED" ? 401 : code === "BAD_ORIGIN" ? 403 : 403;
  }
}

/** Buyer may only act on their own orders. */
export function requireBuyer(session: SessionPayload, orderBuyerId: string): void {
  if (session.sub !== orderBuyerId) {
    throw new AuthzError("FORBIDDEN", "You do not own this order");
  }
}

/** Merchant portal / merchant-only actions. */
export function requireMerchant(session: SessionPayload): void {
  if (session.role !== "MERCHANT") {
    throw new AuthzError("FORBIDDEN", "Merchant access required");
  }
}

/** TrustPay admin console / admin-only actions. */
export function requireTrustPayAdmin(session: SessionPayload): void {
  if (session.role !== "TRUSTPAY_ADMIN") {
    throw new AuthzError("FORBIDDEN", "TrustPay admin access required");
  }
}

/**
 * CSRF-style check for cookie-authenticated mutating routes.
 * Requires Origin to match APP_URL exactly (no trailing slash mismatch).
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    throw new AuthzError("BAD_ORIGIN", "Missing Origin header");
  }

  const appUrl = normalizeOrigin(getEnv().APP_URL);
  if (normalizeOrigin(origin) !== appUrl) {
    throw new AuthzError("BAD_ORIGIN", "Origin does not match APP_URL");
  }
}

function normalizeOrigin(value: string): string {
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return value.replace(/\/$/, "");
  }
}

/** Map auth/authz errors to a JSON NextResponse. */
export function authErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthzError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof AuthError) {
    const status = error.code === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  return null;
}
