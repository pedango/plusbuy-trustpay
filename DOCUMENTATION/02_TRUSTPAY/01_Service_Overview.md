# TrustPay — Service Overview

## What TrustPay is
TrustPay is a logical payment and escrow service embedded in the PlusBuy modular monolith. It exposes `/api/trustpay/v1/*`, checkout UI under `/trustpay/checkout/[token]`, and an admin console at `/trustpay/admin`.

## Why it exists
To hold buyer payments until fulfilment conditions are met, keep a double-entry ledger as balance source of truth, and notify merchants (PlusBuy) via signed webhooks.

## Relationship with PlusBuy
PlusBuy is a merchant client. It authenticates with `TRUSTPAY_API_KEY` (Bearer `tp_test_…`), creates payments, requests release/refund/dispute, and receives webhooks. TrustPay does not import shop modules.

## Responsibilities (implemented)
- Payment create + checkout token
- Simulated MoMo start/approve/cancel
- Ledger HOLD / RELEASE / REFUND / WITHDRAWAL
- Dispute open/resolve
- Optional shipment → autoReleaseAt
- Webhook outbox with retries
- Merchant balance/ledger/payouts
- Admin ops and demo clock

## Boundaries and limitations
- **Simulated** collection: `SimulatedMomoProvider` only; `RealMtnMomoProvider` is an unwired stub.
- Ledger escrow is application bookkeeping, not licensed safeguarded funds.
- Layout banner: “Simulated gateway: no real money moves.”
