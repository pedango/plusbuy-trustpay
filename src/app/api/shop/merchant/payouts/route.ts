import { CreatePayoutRequestSchema } from "@/contracts/trustpay";
import { assertSameOrigin, authErrorResponse, requireMerchant } from "@/lib/authz";
import { requireSession } from "@/lib/session";
import { trustpayClient } from "@/lib/trustpay-client";
import { newId } from "@/lib/ids";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    requireMerchant(session);
    const input = CreatePayoutRequestSchema.parse(await request.json());
    const payout = await trustpayClient.createPayout(input, `payout_${newId("pout")}`);
    return Response.json({ data: payout });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Payout failed";
    return Response.json({ error: message }, { status: 422 });
  }
}
