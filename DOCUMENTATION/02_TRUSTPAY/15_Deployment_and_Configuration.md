# TrustPay — Deployment and Configuration

Runs in the same Next.js deployment as PlusBuy.

Env names: `APP_URL`, `TRUSTPAY_*` (shop client), `CRON_SECRET`, `AUTO_RELEASE_DAYS`, `SESSION_SECRET` (admin), database URLs.

Cron: `0 6 * * *` → `/api/trustpay/cron/maintenance`.

Merchant webhook URL/secret and API key hash seeded on `TpMerchant` (not only env).
