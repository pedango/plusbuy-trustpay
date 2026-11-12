import { getEnv } from "@/lib/env";
import { TrustPayError } from "@/lib/trustpay-client";
import { applyTrustPayWebhook } from "@/modules/shop/services/order.service";
import { trustpayClient } from "@/lib/trustpay-client";

export async function POST(request: Request) {
  const raw = await request.text();
  try {
    const payload = trustpayClient.verifyWebhook(
      raw,
      request.headers.get("trustpay-signature"),
      getEnv().TRUSTPAY_WEBHOOK_SECRET,
    );
    await applyTrustPayWebhook(payload);
    return new Response("ok", { status: 200 });
  } catch (error) {
    if (error instanceof TrustPayError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }
    return Response.json({ error: "Webhook failed" }, { status: 400 });
  }
}
