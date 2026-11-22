# TrustPay — Testing Strategy

- Unit: payment.machine, fees, ledger, phone, idempotency, webhook signature
- Integration: hold/release concurrency, payout overdraw, dispute, auto-release, webhook retry
- E2E: full escrow path with simulated PIN
- Architecture: TrustPay must not import modules/shop
