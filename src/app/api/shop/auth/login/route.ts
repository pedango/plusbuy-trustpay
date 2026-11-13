import { NextResponse } from "next/server";
import { z } from "zod";
import { login } from "@/lib/auth";
import { assertSameOrigin, authErrorResponse } from "@/lib/authz";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const result = await login(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, user: result.user });
  } catch (error) {
    const mapped = authErrorResponse(error);
    if (mapped) return mapped;

    const message = error instanceof Error ? error.message : "Login failed";
    logger.error({
      msg: "login_route_error",
      event: "auth.login_error",
      error: message,
    });

    // Surface the common production misconfig without leaking secrets.
    if (/Invalid environment configuration/i.test(message)) {
      return NextResponse.json(
        { error: "Server misconfigured: check APP_URL and SESSION_SECRET on Vercel" },
        { status: 500 },
      );
    }
    if (/Can't reach database|P1001|P1017|does not exist|P2021/i.test(message)) {
      return NextResponse.json(
        { error: "Database unavailable. Run migrate deploy and seed against production." },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
