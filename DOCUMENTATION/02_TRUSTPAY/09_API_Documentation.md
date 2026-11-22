# TrustPay — API Documentation

Base: `/api/trustpay/v1`. Merchant auth: `Authorization: Bearer tp_test_…`. Mutating merchant routes require `Idempotency-Key`.

## Merchant payments
| Method | Path | Body / notes |
|--------|------|--------------|
| POST | `/payments` | amountMinor, reference, description?, returnUrl |
| GET | `/payments/[id]` | |
| POST | `/payments/[id]/release` | {} |
| POST | `/payments/[id]/refund` | {} |
| POST | `/payments/[id]/dispute` | { reason } |
| POST | `/payments/[id]/shipment` | {} sets autoReleaseAt |

## Checkout (public)
| Method | Path | Body |
|--------|------|------|
| GET | `/checkout/[token]` | session |
| POST | `/checkout/[token]/start` | network, phone |
| POST | `/checkout/[token]/approve` | pin (4 digits) |
| POST | `/checkout/[token]/cancel` | |

## Merchant money
| Method | Path | Notes |
|--------|------|-------|
| GET | `/merchant/balance` | derived |
| GET | `/merchant/ledger` | limit, cursor |
| GET/POST | `/merchant/payouts` | POST: amountMinor, network, phone |

## Admin (TRUSTPAY_ADMIN session)
Payments list, disputes list/resolve, webhooks list/retry, ledger-integrity, demo fast-forward/maintenance/reset.

## Cron
`GET /api/trustpay/cron/maintenance` with `Authorization: Bearer CRON_SECRET`.

Contracts: `src/contracts/trustpay.ts`.
