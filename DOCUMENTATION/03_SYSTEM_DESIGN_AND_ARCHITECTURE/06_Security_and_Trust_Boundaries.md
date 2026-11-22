# Security and Trust Boundaries

| Boundary | Control |
|----------|---------|
| Browser ↔ PlusBuy | Session cookie, same-origin mutations, CSP |
| PlusBuy ↔ TrustPay | API key, idempotency, zod validation |
| TrustPay ↔ Merchant webhook | HMAC signature + timestamp |
| TrustPay ↔ MoMo port | Simulated adapter; real adapter unwired |
| Admin | TRUSTPAY_ADMIN session |
| Cron | Bearer CRON_SECRET |

Trust boundary diagram: `security_trust_boundaries.mmd`.
