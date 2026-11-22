# PlusBuy — Deployment and Configuration

## Stack
Next.js 15 on Vercel (intended), PostgreSQL (Neon or local), Prisma migrations.

## Environment variables (names)
See `.env.example`: `DATABASE_URL`, `DIRECT_URL`, `DATABASE_URL_TEST`, `APP_URL`, `SESSION_SECRET`, `TRUSTPAY_BASE_URL`, `TRUSTPAY_API_KEY`, `TRUSTPAY_WEBHOOK_SECRET`, `CRON_SECRET`, `AUTO_RELEASE_DAYS`.

## Scripts
`pnpm dev`, `pnpm build`, `pnpm start`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm test`, `pnpm test:e2e`.

## Cron (vercel.json)
`0 7 * * *` → `GET /api/shop/cron/reconcile`

## Seed
Creates demo users, products, TrustPay merchant, demo clock, order sequence.
