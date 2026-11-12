import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";
import { assertSameOrigin, authErrorResponse } from "@/lib/authz";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await logout();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mapped = authErrorResponse(error);
    if (mapped) return mapped;
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
