# PlusBuy — User Workflows

## Buyer purchase (implemented)

```mermaid
flowchart TD
  A[Browse / search] --> B[Add to cart]
  B --> C[Cart quantities]
  C --> D{Signed in as BUYER?}
  D -->|No| E[Login]
  E --> D
  D -->|Yes| F[POST /api/shop/orders]
  F --> G[Redirect TrustPay checkout]
  G --> H[Network + phone + PIN]
  H --> I{Approved?}
  I -->|No| J[Failed / cancelled]
  I -->|Yes| K[payment.held webhook]
  K --> L[PAID_IN_ESCROW]
  L --> M[Optional: merchant rider handoff]
  L --> N[Item received]
  M --> N
  N --> O[TrustPay release]
  O --> P[COMPLETED]
```

## Buyer dispute

PAID_IN_ESCROW or SHIPPED → Report problem → TrustPay dispute + order DISPUTED → Admin resolves refund or release → webhook updates order.

## Merchant rider handoff

PAID_IN_ESCROW → Hand to rider → SHIPPED. Payment remains HELD until buyer release. **Current PlusBuy ship route does not call TrustPay recordShipment.**

## Merchant payout

View available balance → POST payout with network + phone → TrustPay simulated payout completes after short delay.
