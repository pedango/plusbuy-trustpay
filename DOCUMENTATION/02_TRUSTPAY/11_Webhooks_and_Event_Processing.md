# TrustPay — Webhooks and Event Processing

## Outbox
State changes write `TpWebhookEvent` PENDING in the same DB transaction as ledger/status.

## Delivery
`HttpWebhookTransport` POSTs to merchant `webhookUrl` with:
- `TrustPay-Signature: t=<unix>,v1=<hmac-sha256>`
- `X-TrustPay-Event`, `X-TrustPay-Delivery`

Payload types: payment.held | released | refunded | disputed | failed | expired.

## Verification (shop)
HMAC over `${t}.${rawBody}`; ±300s skew; secret from env for PlusBuy.

## Retries
Max 8 attempts; backoff 30s → 24h; then FAILED. Admin can retry. Maintenance delivers due webhooks.

## Idempotency / ordering
Shop stores `ProcessedWebhook.eventId`. Integration tests cover dedupe and out-of-order handling.
