export type WebhookDeliverResult = {
  ok: boolean;
  status: number;
  error?: string;
};

/**
 * Port for delivering signed webhook HTTP POSTs to merchant endpoints.
 */
export interface WebhookTransport {
  deliver(
    url: string,
    headers: Record<string, string>,
    body: string,
  ): Promise<WebhookDeliverResult>;
}
