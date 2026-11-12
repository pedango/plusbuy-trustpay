import type {
  WebhookDeliverResult,
  WebhookTransport,
} from "@/modules/trustpay/ports/webhook-transport";

const DEFAULT_TIMEOUT_MS = 5_000;

/** HTTP POST webhook transport with a hard 5s timeout. */
export class HttpWebhookTransport implements WebhookTransport {
  constructor(private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS) {}

  async deliver(
    url: string,
    headers: Record<string, string>,
    body: string,
  ): Promise<WebhookDeliverResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body,
        signal: controller.signal,
      });
      return {
        ok: res.ok,
        status: res.status,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error instanceof Error ? error.message : "Webhook delivery failed",
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
