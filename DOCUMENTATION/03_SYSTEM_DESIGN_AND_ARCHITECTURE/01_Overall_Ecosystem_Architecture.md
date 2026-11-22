# Overall Ecosystem Architecture

## Current system
One Next.js app, one Postgres database, two bounded contexts: PlusBuy (shop) and TrustPay (payments/escrow).

```mermaid
flowchart LR
  Buyer --> PlusBuyUI[PlusBuy UI]
  Merchant --> PlusBuyUI
  Admin --> TrustPayAdmin[TrustPay Admin]
  PlusBuyUI --> ShopAPI["/api/shop"]
  ShopAPI --> ShopDB[(Shop tables)]
  ShopAPI --> TPClient[trustpay-client]
  TPClient --> TPAPI["/api/trustpay/v1"]
  Buyer --> Checkout["/trustpay/checkout"]
  Checkout --> TPAPI
  TPAPI --> TPDB[(Tp tables)]
  TPAPI --> MoMo[SimulatedMomoProvider]
  TPAPI -->|signed webhook| ShopWH["/api/shop/webhooks/trustpay"]
  ShopWH --> ShopDB
```

## Proposed future (not implemented)
Separate TrustPay deployable with live MoMo PSP and licensed safeguarded accounts. Keep HTTP+webhook contract.
