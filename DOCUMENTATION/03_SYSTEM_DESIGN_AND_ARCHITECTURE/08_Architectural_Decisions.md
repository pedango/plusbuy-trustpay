# Architectural Decisions

Repo ADRs under `docs/adr/` (referenced, not duplicated verbatim):

| ADR theme | Decision |
|-----------|----------|
| Modular monolith | One deployable, hard module boundaries |
| Ledger source of truth | Balances derived from immutable entries |
| Outbox webhooks | Status+ledger+event in one transaction |
| Idempotency keys | Safe retries for merchant APIs |
| Simulated MoMo port | Demo without live PSP |

## Decision unique to current product behaviour
**Item received without prior shipment** is legal on PlusBuy (`PAID_IN_ESCROW` → COMPLETED). This matches the physical-shop + rider model and supersedes older README wording that required SHIPPED first.
