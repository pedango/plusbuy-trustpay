# TrustPay — Escrow Management Architecture

## Holding
On APPROVED: BUYER_WALLET −amount, ESCROW +amount (HOLD txn).

## Release
On RELEASE_REQUESTED / AUTO_RELEASE_DUE / DISPUTE_RESOLVED_RELEASE:
ESCROW −amount; MERCHANT_AVAILABLE +net; TRUSTPAY_REVENUE +fee.

Fee: `floor((amountMinor * feeBps + 5000) / 10000)` with merchant `feeBps` (seed 150 = 1.5%).

## Refund
ESCROW −amount; BUYER_REFUNDED +amount (no fee).

## Duplicate prevention
Idempotency keys; soft return if already RELEASED/REFUNDED; optimistic version on payment.

## Dispute restriction
While DISPUTED, release/refund go through admin resolve events only (not ordinary release while disputed).

## Actual vs proposed
Actual: simulated MoMo + ledger accounts. Proposed: real PSP collection and licensed safeguarded accounts.
