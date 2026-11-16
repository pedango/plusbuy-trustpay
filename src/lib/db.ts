import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Neon suspends idle computes. The first query after sleep can take longer than
 * Prisma's default 2s transaction start and 5s connect, which surfaces as
 * "Unable to start a transaction in the given time."
 */
function withParam(url: string, key: string, value: string): string {
  if (new RegExp(`[?&]${key}=`).test(url)) return url;
  const hashAt = url.indexOf("#");
  const base = hashAt === -1 ? url : url.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : url.slice(hashAt);
  return `${base}${base.includes("?") ? "&" : "?"}${key}=${value}${hash}`;
}

function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  let url = withParam(raw, "connect_timeout", "30");
  const host = url.match(/@([^/?]+)/)?.[1] ?? "";
  if (host.includes("-pooler")) url = withParam(url, "pgbouncer", "true");
  return url;
}

const url = databaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    transactionOptions: {
      maxWait: 20_000,
      timeout: 30_000,
    },
  });

globalForPrisma.prisma = prisma;

/** One cheap query so a following transaction does not start against a sleeping Neon compute. */
export async function wakeDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
