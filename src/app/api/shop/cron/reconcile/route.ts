import { timingSafeEqualString } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import { reconcileStaleOrders } from "@/modules/shop/services/order.service";

export async function GET(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const secret = getEnv().CRON_SECRET;
  if (!token || token.length !== secret.length || !timingSafeEqualString(token, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const changed = await reconcileStaleOrders();
  return Response.json({ data: { changed } });
}
