# ADR 0001: Modular monolith

PlusBuy and TrustPay ship as one Next.js app so the demo deploys as a single Vercel project. They stay separate bounded contexts: no shared tables, no cross-imports, and a versioned HTTP API plus signed webhooks between them. Splitting into two deployables later means moving the TrustPay routes and modules, not rewriting the shop.
