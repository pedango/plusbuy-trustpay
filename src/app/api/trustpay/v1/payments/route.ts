import { CreatePaymentRequestSchema } from "@/contracts/trustpay";
import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { createPayment } from "@/modules/trustpay/services/payments.service";
import { jsonError, jsonOk, requestIdFrom, requireMerchant, withIdempotency } from "../_lib/http";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const ctx = getTrustPayContext();
    const merchant = await requireMerchant(request, ctx);
    const body: unknown = await request.json();
    const input = CreatePaymentRequestSchema.parse(body);
    const result = await withIdempotency(ctx, request, merchant.id, "/payments", input, async (tx) => {
      const data = await createPayment(ctx, merchant.id, input, tx);
      return { status: 201, data };
    });
    return jsonOk(requestId, result.data, result.status);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
