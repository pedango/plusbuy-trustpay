# PlusBuy — User Roles and Permissions

Prisma `Role`: `BUYER`, `MERCHANT`, `TRUSTPAY_ADMIN`.

Middleware (`src/middleware.ts`) is coarse; route handlers re-check roles.

## BUYER (customer)

| Capability | Allowed |
|------------|---------|
| Browse products / search | Yes (public) |
| Use cart | Yes (client; checkout requires login) |
| Create order | Yes |
| View own orders | Yes |
| Item received | Own order, PAID_IN_ESCROW or SHIPPED |
| Cancel | Own order, PENDING_PAYMENT or PAID_IN_ESCROW |
| Report problem | Own order, PAID_IN_ESCROW or SHIPPED |
| Merchant routes | No |

## MERCHANT (seller)

| Capability | Allowed |
|------------|---------|
| `/merchant/*` | Yes |
| Create / patch products | Yes |
| Delete products | No |
| Hand to rider / cancel orders | Yes |
| Balance, ledger, payouts | Yes via TrustPay client |
| Buyer checkout | No (order create requires BUYER) |

## TRUSTPAY_ADMIN

Operates `/trustpay/admin` (TrustPay). No dedicated PlusBuy admin product APIs.

## Demo accounts
Password `Demo@1234`: `john@plusbuy.demo` (BUYER), `merchant@plusbuy.demo` (MERCHANT), `admin@trustpay.demo` (TRUSTPAY_ADMIN).
