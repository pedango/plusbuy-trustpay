import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { getEnv } from "@/lib/env";

export const SESSION_COOKIE = "pb_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  sub: string;
  email: string;
  role: Role;
  name: string;
};

export class AuthError extends Error {
  readonly code: "UNAUTHORIZED" | "FORBIDDEN";

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

const ROLES: ReadonlySet<string> = new Set(["BUYER", "MERCHANT", "TRUSTPAY_ADMIN"]);

function getSecretKey(secret = getEnv().SESSION_SECRET): Uint8Array {
  return new TextEncoder().encode(secret);
}

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

function parseSessionClaims(payload: JWTPayload): SessionPayload | null {
  const sub = typeof payload.sub === "string" ? payload.sub : null;
  const email = typeof payload.email === "string" ? payload.email : null;
  const name = typeof payload.name === "string" ? payload.name : null;
  const role = typeof payload.role === "string" && ROLES.has(payload.role) ? (payload.role as Role) : null;

  if (!sub || !email || !name || !role) return null;
  return { sub, email, role, name };
}

/** Verify a raw JWT session token (usable from middleware / Edge). */
export async function verifySessionToken(
  token: string,
  secret = process.env.SESSION_SECRET,
): Promise<SessionPayload | null> {
  if (!token || !secret || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(secret), {
      algorithms: ["HS256"],
    });
    return parseSessionClaims(payload);
  } catch {
    return null;
  }
}

export async function createSession(session: SessionPayload): Promise<void> {
  const env = getEnv();
  const token = await new SignJWT({
    email: session.email,
    role: session.role,
    name: session.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey(env.SESSION_SECRET));

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(env.NODE_ENV === "production"));
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token, getEnv().SESSION_SECRET);
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    ...cookieOptions(getEnv().NODE_ENV === "production"),
    maxAge: 0,
  });
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("UNAUTHORIZED", "Authentication required");
  }
  return session;
}
