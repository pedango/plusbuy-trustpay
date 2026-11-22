# TrustPay — Service Architecture

## Composition
`createTrustPayContext()` wires Prisma, `DemoClock`, `SimulatedMomoProvider`, `HttpWebhookTransport`.

## Modules
- `domain/` — payment.machine, ledger recipes, fees, phone
- `services/` — payments, escrow, balances, payouts, disputes, webhooks, maintenance, demo, idempotency
- `adapters/` — simulated MoMo, HTTP webhooks, demo clock
- `ports/` — MobileMoneyProvider, WebhookTransport

## Request path
HTTP route → auth (merchant/admin/cron/public) → zod validate → service → Prisma transaction (status + ledger + outbox) → optional webhook flush.

See diagrams: `trustpay_component_architecture.mmd`, `payment_state_machine.mmd`.
