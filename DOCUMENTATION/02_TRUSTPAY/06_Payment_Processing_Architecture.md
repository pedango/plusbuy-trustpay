# TrustPay — Payment Processing Architecture

## Create
Merchant POST `/payments` with amountMinor, reference, returnUrl → status INITIATED, checkoutToken, expiresAt (+30m), checkout URL under `/trustpay/checkout/{token}`.

## Start
Public POST checkout start with network + phone → CHECKOUT_STARTED → AWAITING_APPROVAL; provider.requestPayment (simulated).

## Approve / decline
- Approve PIN: 0000 insufficient funds, 9999 wrong PIN, else APPROVED → HELD + HOLD ledger + `payment.held` outbox
- Cancel/decline → FAILED + `payment.failed`
- Expiry maintenance → EXPIRED + `payment.expired`

## Confirmation
No external PSP webhook in runtime; confirmation is the approve route after simulated provider.confirmPayment.

## Status outcomes
INITIATED, AWAITING_APPROVAL, HELD, DISPUTED, RELEASED, REFUNDED, FAILED, EXPIRED.
