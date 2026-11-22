# PlusBuy — API Documentation

Base path: `/api/shop`. Mutating cookie routes require same-origin (`assertSameOrigin`). JSON envelopes typically `{ data }` or `{ error }`.

## Auth

### POST `/api/shop/auth/login`
- Auth: public + same-origin
- Body: `{ email, password }`
- 200: `{ ok, user }` + sets `pb_session`
- Errors: 400 validation, 401 invalid, 429 throttled

### POST `/api/shop/auth/logout`
Clears session cookie → `{ ok: true }`

### GET `/api/shop/auth/session`
Returns `{ user: null | { name, email, role } }`

## Orders

### POST `/api/shop/orders`
- Auth: BUYER session
- Body: `{ items: [{ productId, quantity }] }`
- Creates order, decrements stock, creates TrustPay payment
- 200: `{ data: { orderId, checkoutUrl, code } }`

### POST `/api/shop/orders/[id]/ship`
- Auth: MERCHANT
- Body: `{ deliveryNote? }`
- Requires `PAID_IN_ESCROW` → `SHIPPED`
- Does **not** call TrustPay shipment API

### POST `/api/shop/orders/[id]/confirm-delivery`
- Auth: buyer owns order
- Allowed statuses: `PAID_IN_ESCROW` | `SHIPPED`
- Calls TrustPay release then `ITEM_RECEIVED` → `COMPLETED`

### POST `/api/shop/orders/[id]/cancel`
- Auth: buyer owner or MERCHANT
- Allowed: `PENDING_PAYMENT` | `PAID_IN_ESCROW`
- Paid path refunds via TrustPay then cancels

### POST `/api/shop/orders/[id]/report-problem`
- Auth: buyer owner
- Body: `{ reason }`
- Opens TrustPay dispute; order → `DISPUTED`

## Merchant

### POST `/api/shop/merchant/products`
- Auth: MERCHANT
- Body: name, description, priceGhs, colorHex?, stock, imageUrl?
- 201 product

### PATCH `/api/shop/merchant/products`
- Auth: MERCHANT
- Body: `{ id, stock, active, imageUrl? }`

### GET `/api/shop/merchant/balance`
Proxies TrustPay merchant balance

### POST `/api/shop/merchant/payouts`
Body matches TrustPay `CreatePayoutRequest` (amountMinor, network, phone)

## Webhooks / cron

### POST `/api/shop/webhooks/trustpay`
- Auth: `TrustPay-Signature` HMAC with `TRUSTPAY_WEBHOOK_SECRET`
- Applies payment lifecycle events to orders

### GET `/api/shop/cron/reconcile`
- Auth: `Authorization: Bearer CRON_SECRET`
- Reconciles stale orders with TrustPay payment status

## Notes
There is no public REST list/detail for orders or products; pages query Prisma in Server Components.
