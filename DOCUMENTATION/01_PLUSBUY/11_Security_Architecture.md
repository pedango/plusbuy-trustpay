# PlusBuy — Security Architecture

## Authentication
- Passwords hashed with bcrypt.
- Session: HS256 JWT in `pb_session`, httpOnly, sameSite=lax, secure in production.
- Login attempt throttling.

## Authorisation
- Middleware gates `/merchant`, `/orders`, `/cart`, `/trustpay/admin` by role/session.
- Handlers call session/role checks; buyers checked for order ownership.

## CSRF / origin
Mutating shop APIs use `assertSameOrigin`.

## Webhooks
TrustPay → shop: HMAC `TrustPay-Signature` verified with `TRUSTPAY_WEBHOOK_SECRET`. Event IDs in `ProcessedWebhook`.

## Headers / CSP
Configured in `next.config.ts`.

## Secrets (names only)
`SESSION_SECRET`, `TRUSTPAY_API_KEY`, `TRUSTPAY_WEBHOOK_SECRET`, `CRON_SECRET`, database URLs.

## Residual risks
- Cart is localStorage until server validates on order create.
- Admin demo reset can wipe shop data.
- Simulated MoMo must not be treated as production collection.
