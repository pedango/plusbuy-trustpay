# TrustPay — Database Design

## Models (Prisma `Tp*`)

| Model | Purpose |
|-------|---------|
| TpMerchant | API key hash, webhook URL/secret, feeBps |
| TpPayment | Payment + escrow fields, checkoutToken, timestamps |
| TpLedgerTxn / TpLedgerEntry | Double-entry |
| TpPayout | Withdrawals |
| TpDispute | Open/resolved disputes |
| TpWebhookEvent | Outbox |
| TpIdempotencyKey | Replay store |
| TpDemoClock | offsetSeconds |

## Payment statuses
INITIATED, AWAITING_APPROVAL, HELD, DISPUTED, RELEASED, REFUNDED, FAILED, EXPIRED

## Accounts
BUYER_WALLET, ESCROW, MERCHANT_AVAILABLE, TRUSTPAY_REVENUE, MERCHANT_WITHDRAWN, BUYER_REFUNDED

## Constraints
Unique `(merchantId, reference)`; unique `checkoutToken`; unique `(merchantId, key)` idempotency.

Full ER: see `database_erd.mmd`.
