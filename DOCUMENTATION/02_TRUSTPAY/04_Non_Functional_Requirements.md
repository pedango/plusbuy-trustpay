# TrustPay — Non-Functional Requirements

## Verified
- Integer money (pesewas); fee via integer bps formula
- State machine forbids illegal transitions (409)
- Ledger entries net to zero per recipe (unit tests)
- Idempotent mutating APIs
- Webhook signature skew ±300s
- Demo time controllable for expiry/auto-release tests

## Recommended for production
- Live provider SLAs, KYC, reconciliation with bank/PSP statements
- Secrets rotation, HSM/KMS
- Horizontal scaling with dedicated DB and queue
