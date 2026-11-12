import { authErrorResponse, requireMerchant } from "@/lib/authz";
import { requireSession } from "@/lib/session";
import { trustpayClient } from "@/lib/trustpay-client";

export async function GET() {
  try {
    const session = await requireSession();
    requireMerchant(session);
    const data = await trustpayClient.getMerchantBalance();
    return Response.json({ data });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    return Response.json({ error: "Balance unavailable" }, { status: 502 });
  }
}
