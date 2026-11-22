# PlusBuy — Non-Functional Requirements

## Verified characteristics (current system)

| ID | Area | Observation |
|----|------|-------------|
| NFR-001 | Security | JWT session cookie; same-origin checks on mutating shop APIs; bcrypt passwords; CSP and security headers in `next.config.ts` |
| NFR-002 | Data integrity | Order transitions via state machine; optimistic `version` on orders; money as integers |
| NFR-003 | Reliability | Neon/Postgres with raised Prisma transaction wait; webhook dedupe via `ProcessedWebhook`; reconcile cron |
| NFR-004 | Maintainability | Shop modules isolated from TrustPay modules; architecture Vitest test |
| NFR-005 | Usability | Responsive landing header; toast feedback; demo login shortcuts |
| NFR-006 | Auditability | `OrderEvent` timeline per order |

## Recommended (not fully proven as SLOs)

| ID | Area | Recommendation |
|----|------|----------------|
| NFR-010 | Performance | Define p95 checkout latency SLOs under cold Neon wake |
| NFR-011 | Availability | Multi-region DB and health checks for production |
| NFR-012 | Scalability | Separate TrustPay process / connection pools when leaving modular monolith |
| NFR-013 | Accessibility | Formal WCAG audit (not completed in repo) |
| NFR-014 | Observability | Structured ops dashboards beyond console logs |

## Performance notes from implementation

Checkout involves TrustPay interactive transactions and may wait on idle Neon compute. Code sets elevated Prisma `maxWait`/`timeout` and avoids nested pool deadlocks by reading the demo clock on the transaction client.
