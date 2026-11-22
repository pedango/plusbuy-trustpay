# Data Flow Architecture

## Checkout data flow
1. Cart (browser localStorage) → POST shop orders with productId/quantity
2. Shop loads products, computes totalMinor, writes Order/OrderItems, decrements stock
3. Shop creates TrustPay payment; stores paymentId + checkoutUrl
4. Buyer completes MoMo simulation on TrustPay
5. TrustPay HOLD + outbox → webhook → shop PAID_IN_ESCROW

## Release data flow
Buyer Item received → shop releasePayment → TrustPay RELEASE ledger → webhook payment.released → shop may already be COMPLETED from local transition

## Money representation
Always integer pesewas; display via formatGhs.
