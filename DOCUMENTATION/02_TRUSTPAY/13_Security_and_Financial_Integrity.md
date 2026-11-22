# TrustPay — Security and Financial Integrity

- Merchant API keys stored as SHA-256 hashes
- Idempotency-Key required on mutating merchant routes
- Amount/currency validated with zod; GHS pesewas integers
- Fee computed in integer arithmetic
- Optimistic locking via payment `version`
- Ledger invariant checks (admin ledger-integrity + unit tests)
- Webhook HMAC + timestamp skew
- Admin gated by TRUSTPAY_ADMIN session
- Cron gated by CRON_SECRET timing-safe compare

No credentials are documented with values here.
