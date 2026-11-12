import { NextResponse } from "next/server";
import { z } from "zod";
import { login } from "@/lib/auth";
import { assertSameOrigin, authErrorResponse } from "@/lib/authz";

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
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
