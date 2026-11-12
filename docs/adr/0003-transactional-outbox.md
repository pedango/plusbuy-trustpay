# ADR 0003: Transactional outbox

Webhook rows are inserted in the same transaction as the payment change. Delivery happens after commit, with retries and backoff. If the process dies after commit, the cron job and the admin Retry button deliver anything still pending. Sending the webhook inside the transaction would hold locks on the merchant's HTTP latency.
