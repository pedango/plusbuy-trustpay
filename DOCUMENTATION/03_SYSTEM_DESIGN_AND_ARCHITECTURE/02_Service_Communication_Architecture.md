# Service Communication Architecture

## Sync (PlusBuy → TrustPay)
HTTPS to `TRUSTPAY_BASE_URL` with Bearer API key and Idempotency-Key on mutations. Used for create/release/refund/dispute/balance/ledger/payouts.

## Async (TrustPay → PlusBuy)
Signed webhooks to merchant webhook URL (seeded / configured on TpMerchant; shop verifies with `TRUSTPAY_WEBHOOK_SECRET`).

## In-process note
In local/Vercel demo, both sides often share the same origin. They remain logically separate via client + contracts.

## Not used by shop currently
`recordShipment` exists on the client but PlusBuy ship route does not call it.
