import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    DATABASE_URL_TEST: z.string().optional(),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
    APP_URL: z.string().url(),
    TRUSTPAY_BASE_URL: z.string().url(),
    TRUSTPAY_API_KEY: z
      .string()
      .regex(/^tp_test_.+/, "TRUSTPAY_API_KEY must start with tp_test_"),
    TRUSTPAY_WEBHOOK_SECRET: z.string().min(8),
    CRON_SECRET: z.string().min(8),
    AUTO_RELEASE_DAYS: z.coerce.number().int().positive().default(7),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  })
  .strict();

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Validates and returns process environment. Fails fast with a clear message.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    DATABASE_URL_TEST: process.env.DATABASE_URL_TEST,
    SESSION_SECRET: process.env.SESSION_SECRET,
    APP_URL: process.env.APP_URL,
    TRUSTPAY_BASE_URL: process.env.TRUSTPAY_BASE_URL,
    TRUSTPAY_API_KEY: process.env.TRUSTPAY_API_KEY,
    TRUSTPAY_WEBHOOK_SECRET: process.env.TRUSTPAY_WEBHOOK_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    AUTO_RELEASE_DAYS: process.env.AUTO_RELEASE_DAYS ?? "7",
    NODE_ENV: process.env.NODE_ENV ?? "development",
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  cached = parsed.data;
  return cached;
}

/** Reset cached env (tests only). */
export function resetEnvCache(): void {
  cached = null;
}
