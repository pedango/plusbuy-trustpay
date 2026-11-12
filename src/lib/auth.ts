import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { logger } from "@/lib/logger";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

/** Valid bcrypt hash used when no user exists so compare still runs. */
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX12";

export type LoginResult =
  | { ok: true; user: { id: string; email: string; name: string; role: string } }
  | { ok: false; error: string; status: number };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const normalized = normalizeEmail(email);

  if (!normalized || !password) {
    return { ok: false, error: "Email and password are required", status: 400 };
  }

  const since = new Date(Date.now() - WINDOW_MS);
  const recentFailures = await prisma.loginAttempt.count({
    where: {
      email: normalized,
      success: false,
      createdAt: { gte: since },
    },
  });

  if (recentFailures >= MAX_FAILURES) {
    logger.warn({
      msg: "login_throttled",
      event: "auth.login_throttled",
      email: normalized,
    });
    return {
      ok: false,
      error: "Too many failed attempts. Try again in 15 minutes.",
      status: 429,
    };
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Always compare to keep timing closer across hit/miss paths.
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const passwordOk = await bcrypt.compare(password, hash);

  if (!user || !passwordOk) {
    await prisma.loginAttempt.create({
      data: {
        email: normalized,
        userId: user?.id ?? null,
        success: false,
      },
    });
    logger.info({
      msg: "login_failed",
      event: "auth.login_failed",
      email: normalized,
    });
    return { ok: false, error: "Invalid email or password", status: 401 };
  }

  await prisma.loginAttempt.create({
    data: {
      email: normalized,
      userId: user.id,
      success: true,
    },
  });

  await createSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  logger.info({
    msg: "login_success",
    event: "auth.login_success",
    email: user.email,
  });

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function logout(): Promise<void> {
  await destroySession();
}
