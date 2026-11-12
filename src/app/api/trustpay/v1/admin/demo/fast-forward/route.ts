import { z } from "zod";
import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { fastForwardDays } from "@/modules/trustpay/services/demo.service";
import { jsonError, jsonOk, requestIdFrom, requireAdmin } from "../../../_lib/http";

const Body = z.object({ days: z.number().int().positive().max(3650) }).strict();

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    await requireAdmin();
    const input = Body.parse(await request.json());
    const ctx = getTrustPayContext();
    const data = await fastForwardDays(ctx, input.days);
    return jsonOk(requestId, data);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
