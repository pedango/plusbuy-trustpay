import { getTrustPayContext } from "@/modules/trustpay/runtime";
import { resetDemoData } from "@/modules/trustpay/services/demo.service";
import { seedDemo } from "../../../../../../../../prisma/seed";
import { jsonError, jsonOk, requestIdFrom, requireAdmin } from "../../../_lib/http";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    await requireAdmin();
    const ctx = getTrustPayContext();
    await resetDemoData(ctx);
    await seedDemo();
    return jsonOk(requestId, { reset: true });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
