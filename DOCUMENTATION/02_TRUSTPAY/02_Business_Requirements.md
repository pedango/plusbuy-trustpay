# TrustPay — Business Requirements

## Intended business scenario (prompt context)
Buyer pays via MoMo → funds held → seller fulfils → buyer confirms → funds released less fee.

## Implemented mapping

| Business step | Implementation |
|---------------|----------------|
| Create payment intent | POST `/payments` |
| MoMo networks | MTN_MOMO, TELECEL_CASH, AIRTELTIGO_MONEY (UI + enum) |
| Authorise | Simulated PIN (not carrier prompt) |
| Hold | Status HELD + HOLD ledger |
| Fulfil | PlusBuy rider handoff; TrustPay shipment optional |
| Confirm | Merchant calls release (PlusBuy Item received) |
| Dispute | Merchant API dispute + admin resolve refund/release |
| Seller receive funds | RELEASE credits MERCHANT_AVAILABLE; payout withdraws |

## Regulatory note
Actual escrow of customer funds in Ghana requires an authorised PSP arrangement. This demo must not claim independent licence to hold customer money.
