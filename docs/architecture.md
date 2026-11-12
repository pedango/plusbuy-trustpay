# Architecture

PlusBuy and TrustPay live in one Next.js app and one Postgres database. They are separate bounded contexts. Shop code calls TrustPay only through `src/lib/trustpay-client.ts` and the zod contracts in `src/contracts/trustpay.ts`.

## Contexts

```mermaid
flowchart LR
  Buyer --> PlusBuy
  Merchant --> PlusBuy
  PlusBuy -->|"HTTP + Idempotency-Key"| TrustPay
  TrustPay -->|"signed webhook"| PlusBuy
  TrustPay --> MoMo["Mobile money port"]
  Admin --> TrustPay
```

## Escrow sequence

```mermaid
sequenceDiagram
  participant Buyer
  participant PlusBuy
  participant TrustPay
  participant MoMo
  Buyer->>PlusBuy: Checkout
  PlusBuy->>TrustPay: POST /payments
  TrustPay-->>PlusBuy: checkoutUrl
  Buyer->>TrustPay: Network + phone + PIN
  TrustPay->>MoMo: request + confirm
  MoMo-->>TrustPay: APPROVED
  TrustPay->>TrustPay: HOLD ledger + outbox
  TrustPay->>PlusBuy: payment.held
  PlusBuy->>TrustPay: record shipment
  Buyer->>PlusBuy: Item received
  PlusBuy->>TrustPay: release
  TrustPay->>TrustPay: RELEASE ledger
  TrustPay->>PlusBuy: payment.released
```

## Payment states

```mermaid
stateDiagram-v2
  [*] --> INITIATED
  INITIATED --> AWAITING_APPROVAL: CHECKOUT_STARTED
  INITIATED --> EXPIRED: EXPIRY_ELAPSED
  INITIATED --> FAILED: DECLINED
  AWAITING_APPROVAL --> HELD: APPROVED
  AWAITING_APPROVAL --> FAILED: DECLINED
  AWAITING_APPROVAL --> EXPIRED: EXPIRY_ELAPSED
  HELD --> RELEASED: RELEASE or AUTO_RELEASE
  HELD --> REFUNDED: REFUND
  HELD --> DISPUTED: DISPUTE_OPENED
  DISPUTED --> REFUNDED: RESOLVE_REFUND
  DISPUTED --> RELEASED: RESOLVE_RELEASE
```

`recordShipment` is allowed only while `HELD`. It sets `shippedAt` and `autoReleaseAt` and does not change status. Disputed payments are not auto-released.

## Order states

```mermaid
stateDiagram-v2
  [*] --> PENDING_PAYMENT
  PENDING_PAYMENT --> PAID_IN_ESCROW: payment.held
  PENDING_PAYMENT --> CANCELLED: failed or expired
  PAID_IN_ESCROW --> SHIPPED: merchant ships
  PAID_IN_ESCROW --> CANCELLED: cancel
  PAID_IN_ESCROW --> DISPUTED: dispute
  SHIPPED --> COMPLETED: item received or payment.released
  SHIPPED --> DISPUTED: dispute
  DISPUTED --> COMPLETED: payment.released
  DISPUTED --> REFUNDED: payment.refunded
  CANCELLED --> REFUNDED: payment.refunded
```

## Ledger example

A GH₵ 120.00 shirt (`12000` pesewas) at 150 bps:

- HOLD: `BUYER_WALLET -12000`, `ESCROW +12000`
- RELEASE: fee `180`, net `11820`. `ESCROW -12000`, `MERCHANT_AVAILABLE +11820`, `TRUSTPAY_REVENUE +180`
- REFUND (no fee): `ESCROW -12000`, `BUYER_REFUNDED +12000`
- WITHDRAWAL of the net: `MERCHANT_AVAILABLE -11820`, `MERCHANT_WITHDRAWN +11820`

Every transaction sums to zero. Balances are sums of immutable entries.
