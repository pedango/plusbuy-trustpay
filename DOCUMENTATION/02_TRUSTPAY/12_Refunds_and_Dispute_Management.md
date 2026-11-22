# TrustPay — Refunds and Dispute Management

## Refund
Merchant POST refund while HELD → REFUNDED + REFUND ledger + payment.refunded webhook.

## Dispute
Merchant POST dispute with reason → DISPUTED + OPEN TpDispute + payment.disputed.

Admin resolve:
- REFUND → DISPUTE_RESOLVED_REFUND
- RELEASE → DISPUTE_RESOLVED_RELEASE

PlusBuy maps webhooks to order DISPUTED / REFUNDED / COMPLETED.

## Simulated vs real
Refund credits BUYER_REFUNDED ledger account; no real MoMo reversal rail is wired.
