import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "@/lib/session";

/**
 * Coarse role gating only. Route handlers and server actions MUST re-check
 * authorization (ownership, merchant, admin, same-origin) — do not rely on
 * middleware alone for business auth.
 */

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/login") return true;
  if (pathname.startsWith("/products")) return true;
  if (pathname.startsWith("/trustpay/checkout")) return true;
  if (pathname.startsWith("/trustpay/approve")) return true;
  if (pathname.startsWith("/api/trustpay/v1")) return true;
  if (pathname.startsWith("/api/shop/webhooks")) return true;
  if (pathname.startsWith("/api/trustpay/cron")) return true;
  if (pathname.startsWith("/api/shop/cron")) return true;
  if (pathname.startsWith("/api/shop/auth")) return true;
  return false;
}

async function readSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

function redirectToLogin(request: NextRequest): NextResponse {
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/brand") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = await readSession(request);

  if (pathname.startsWith("/merchant")) {
    if (!session || session.role !== "MERCHANT") {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/trustpay/admin")) {
    if (!session || session.role !== "TRUSTPAY_ADMIN") {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/orders") ||
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/")
  ) {
    if (!session) {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
