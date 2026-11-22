# TrustPay — Reconciliation and Audit Trail

## Ledger as SoT
Balances = sum of TpLedgerEntry by account. Admin integrity endpoint checks invariants.

## Operational reconciliation
- Maintenance auto-releases and expires payments
- PlusBuy reconcile cron compares stale orders to TrustPay payment status
- Webhook outbox log with attempts/errors

## Audit artefacts
Payment timestamps (heldAt, releasedAt, …), ledger txns with memo/type, dispute records, idempotency responses.
