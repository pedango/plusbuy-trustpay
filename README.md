# PlusBuy + TrustPay

PlusBuy is a small shirt shop. TrustPay is a simulated escrow payment gateway. A buyer pays with mobile money, TrustPay holds the money, and the merchant is paid only after the buyer confirms delivery (or after the auto-release window).

Mobile money is simulated. No real money moves. The simulator sits behind `MobileMoneyProvider`, so a real provider can replace it without changing ledger or state-machine code.

## Quick start

```bash
pnpm install
docker run -d --name plusbuy-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -p 5432:5432 postgres:16
# create databases plusbuy_trustpay and plusbuy_trustpay_test
cp .env.example .env
pnpm exec prisma migrate deploy
pnpm db:seed
pnpm dev
```

Open http://localhost:3000.

## Environment

See `.env.example`. Required: `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` (32+ chars), `APP_URL`, `TRUSTPAY_BASE_URL`, `TRUSTPAY_API_KEY` (`tp_test_…`), `TRUSTPAY_WEBHOOK_SECRET`, `CRON_SECRET`, `AUTO_RELEASE_DAYS`.

## Demo accounts

Password for all three: `Demo@1234`

| Email | Role |
| --- | --- |
| john@plusbuy.demo | Buyer |
| merchant@plusbuy.demo | Merchant |
| admin@trustpay.demo | TrustPay admin |

## Demo script (about 3 minutes)

1. Sign in as John and buy the Red Cotton Shirt.
2. On TrustPay checkout, keep MTN MoMo and `0244000000`, then approve with PIN `1234` (`0000` declines, `9999` is a wrong PIN).
3. Sign in as the merchant. The order is held in escrow. Mark it shipped.
4. Back as John, click **Item received**. The merchant available balance increases by the net amount (1.5% fee).
5. Sign in as `admin@trustpay.demo` and open **Ledger integrity**. All five checks should be green.

## Tests

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Deployment

Deploy the Next.js app on Vercel with the same env vars and a hosted Postgres database (`DATABASE_URL` and `DIRECT_URL`). `vercel.json` schedules daily maintenance and shop reconciliation. The admin **Run maintenance now** button calls the same job.

## Simulated vs real

| Piece | This demo | Production |
| --- | --- | --- |
| Mobile money | `SimulatedMomoProvider` | `RealMtnMomoProvider` (not wired) |
| Funds | Ledger rows only | A licensed escrow account |
| Webhooks | HTTP to this app | Merchant webhook URL |
| Time | `TpDemoClock` offset | Real time |

## Acceptance checklist

- A buyer cannot release someone else's order (server checks the session user).
- **Item received** is rejected unless the order is `SHIPPED`.
- Cancelling before shipment refunds the full amount and charges no fee.
- Ledger integrity stays all green after each scenario above.

## Assumptions

- Logo files were not in the repo at scaffold time. The attached PlusBuy and TrustPay marks are saved as `public/brand/plusbuy-logo.jpg` and `public/brand/trustpay-logo.jpg`. Brand colors were sampled from those files: PlusBuy orange `#FD6B02` and navy `#022169`; TrustPay green `#23A90A` and navy `#022466`.
- Checkout tokens expire after 30 minutes.
- Payouts are marked paid by the simulator about 2 seconds after creation.
- Vercel Hobby cron runs once a day, so the admin button is the demo control for maintenance.
- Shop and TrustPay share one database and one deployment, but they do not share tables, domain types, or imports. The shop reaches TrustPay only through `lib/trustpay-client.ts`.
- The layout names Inter first and falls back to system-ui, so pages still render when the Google font CDN cannot be reached.
- Interactive Prisma transactions and the TrustPay HTTP client wait up to 20s and 30s so a slow database can finish a release before the shop gives up.
