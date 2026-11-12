# ADR 0002: Ledger is the source of truth

Merchant balances are sums of immutable double-entry rows. A release, its ledger lines, and its outbox event commit in one transaction. Postgres rejects unbalanced transactions and any update or delete of a ledger entry. Stored balance columns would drift from the audit trail, so they are not used.
