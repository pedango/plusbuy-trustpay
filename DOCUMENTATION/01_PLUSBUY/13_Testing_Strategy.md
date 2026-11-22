# PlusBuy — Testing Strategy

## Unit
`tests/unit/order.machine.test.ts` — order transitions including `PAID_IN_ESCROW` → `ITEM_RECEIVED`.

## Architecture
`tests/architecture.test.ts` — shop must not import TrustPay modules / Tp models.

## Integration
Escrow and webhook scenarios in `tests/integration/escrow.test.ts` (requires `DATABASE_URL_TEST`).

## E2E
Playwright `tests/e2e/escrow.spec.ts` — checkout through Item received and merchant net amount.

## Manual acceptance
Use seeded accounts; verify multi-item cart, PIN decline `0000`, release path.
