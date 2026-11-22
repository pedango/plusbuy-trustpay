# TrustPay — Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| TFR-001 | Create payment with amountMinor, reference, returnUrl | Implemented |
| TFR-002 | Unique (merchantId, reference) | Implemented |
| TFR-003 | Checkout session by token | Implemented |
| TFR-004 | Start checkout with network + phone | Implemented |
| TFR-005 | Approve with 4-digit PIN | Simulated |
| TFR-006 | Decline/cancel checkout | Implemented |
| TFR-007 | Expire unpaid checkouts (30 min) via maintenance | Implemented |
| TFR-008 | HOLD ledger on approval | Implemented |
| TFR-009 | Release escrow (idempotent) | Implemented |
| TFR-010 | Refund escrow | Implemented |
| TFR-011 | Open dispute while HELD | Implemented |
| TFR-012 | Admin resolve dispute to refund or release | Implemented |
| TFR-013 | Record shipment sets autoReleaseAt | Implemented (API); PlusBuy currently unused |
| TFR-014 | Auto-release due HELD payments | Implemented |
| TFR-015 | Merchant balance + ledger | Implemented |
| TFR-016 | Merchant payouts | Simulated provider always PAID |
| TFR-017 | Signed webhook outbox + retries | Implemented |
| TFR-018 | Idempotency-Key on mutating merchant APIs | Implemented |
| TFR-019 | Demo clock fast-forward / reset | Implemented |
| TFR-020 | Live MTN MoMo API | Not Implemented (stub) |
