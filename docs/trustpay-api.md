# TrustPay API v1

Base path: `/api/trustpay/v1`

Success: `{ "data": {}, "requestId": "req_…" }`  
Error: `{ "error": { "code", "message", "details?" }, "requestId" }`

Every response includes `X-Request-Id`. Mutating merchant calls require `Idempotency-Key`. The same key and body replay the stored response. The same key with a different body returns `422 idempotency_key_reuse`.

## Auth

Merchant routes: `Authorization: Bearer tp_test_…` (sha256 of the key is stored).  
Checkout routes: the unguessable checkout token.  
Admin routes: a `TRUSTPAY_ADMIN` session cookie.

## Merchant

```bash
curl -X POST "$TRUSTPAY_BASE_URL/api/trustpay/v1/payments" \
  -H "Authorization: Bearer $TRUSTPAY_API_KEY" \
  -H "Idempotency-Key: order_123_create" \
  -H "Content-Type: application/json" \
  -d '{"amountMinor":12000,"reference":"PB-1001","returnUrl":"http://localhost:3000/orders/1"}'
```

- `POST /payments` `{ amountMinor, reference, description?, returnUrl }` → `201` `{ id, status: INITIATED, checkoutUrl, expiresAt }`
- `GET /payments/:id`
- `POST /payments/:id/shipment`
- `POST /payments/:id/release`
- `POST /payments/:id/refund`
- `POST /payments/:id/dispute` `{ reason }` (3–500 chars)
- `GET /merchant/balance`
- `GET /merchant/ledger?limit=&cursor=`
- `POST /merchant/payouts` `{ amountMinor, network, phone }`
- `GET /merchant/payouts`

Amounts are pesewas, GH₵ 1.00 to GH₵ 50,000.00. Otherwise `422 amount_out_of_range`.

## Checkout

- `POST /checkout/:token/start` `{ network, phone }`
- `POST /checkout/:token/approve` `{ pin }`
- `POST /checkout/:token/cancel`

PIN `0000` declines for insufficient funds. PIN `9999` declines for a wrong PIN. Any other 4 digits approves.

## Admin

Session required.

- `GET /admin/payments`
- `GET /admin/disputes`
- `POST /admin/disputes/:id/resolve` `{ resolution: "REFUND" | "RELEASE" }`
- `GET /admin/webhooks`
- `POST /admin/webhooks/:id/retry`
- `GET /admin/ledger-integrity`
- `POST /admin/demo/fast-forward` `{ days }`
- `POST /admin/demo/maintenance`
- `POST /admin/demo/reset`

## Errors

`validation_error` 422, `unauthorized` 401, `forbidden` 403, `not_found` 404, `invalid_transition` 409, `conflict_retry` 409, `idempotency_key_reuse` 422, `amount_out_of_range` 422, `invalid_phone` 422, `insufficient_available_balance` 422, `payment_expired` 410, `internal_error` 500.

## Webhooks

`TrustPay-Signature: t=<unix>,v1=<hex hmac sha256 of "<t>.<rawBody>">`

Reject timestamps older than 5 minutes. Payload:

```json
{
  "id": "evt_…",
  "type": "payment.held",
  "createdAt": "2026-11-12T00:00:00.000Z",
  "data": {
    "paymentId": "pay_…",
    "reference": "PB-1001",
    "status": "HELD",
    "amountMinor": 12000,
    "feeMinor": 0,
    "netMinor": 0
  }
}
```

Types: `payment.held`, `payment.released`, `payment.refunded`, `payment.disputed`, `payment.failed`, `payment.expired`.

The shop handler returns 200 for duplicates and events that do not apply to the current order. It returns 400 only for a bad signature or payload.
