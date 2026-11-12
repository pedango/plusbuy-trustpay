import { CreatePayoutRequestSchema } from "@/contracts/trustpay";
import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { toPayoutDto } from "@/modules/trustpay/services/mappers";
import { createPayout, listPayouts } from "@/modules/trustpay/services/payouts.service";
import { jsonError, jsonOk, requestIdFrom, requireMerchant, withIdempotency } from "../../_lib/http";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const ctx = getTrustPayContext();
    const merchant = await requireMerchant(request, ctx);
    const rows = await listPayouts(ctx, merchant.id);
    return jsonOk(requestId, rows.map(toPayoutDto));
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const ctx = getTrustPayContext();
    const merchant = await requireMerchant(request, ctx);
    const body: unknown = await request.json();
    const input = CreatePayoutRequestSchema.parse(body);
    const result = await withIdempotency(
      ctx,
      request,
      merchant.id,
      "/merchant/payouts",
      input,
      async (tx) => {
        const payout = await createPayout(ctx, { merchantId: merchant.id, ...input }, tx);
        return { status: 201, data: toPayoutDto(payout) };
      },
    );
    return jsonOk(requestId, result.data, result.status);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
