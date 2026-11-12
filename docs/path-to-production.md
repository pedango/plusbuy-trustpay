# Path to production

This repository is a demo. It does not implement:

- A payments licence or a real trust/escrow bank account
- Live MTN MoMo, Telecel Cash, or AirtelTigo Money APIs
- PCI scope for card data (the demo never sees card numbers or real PINs)
- Production monitoring, paging, or a staffed dispute desk
- A written dispute policy, KYC, or sanctions screening
- Multi-merchant onboarding beyond the seeded PlusBuy merchant

Before real money: licence the escrow activity, hold funds in a segregated account that matches the ledger, replace `SimulatedMomoProvider` with the real adapter, rotate API keys and webhook secrets, and add monitoring on webhook failures and ledger-integrity failures.
