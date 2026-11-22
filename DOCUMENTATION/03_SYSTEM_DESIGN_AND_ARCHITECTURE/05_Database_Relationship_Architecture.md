# Database Relationship Architecture

Single Postgres schema, two logical domains.

- Shop: User, Product, Order, OrderItem, OrderEvent, LoginAttempt, ProcessedWebhook, OrderSequence
- TrustPay: TpMerchant, TpPayment, TpLedgerTxn, TpLedgerEntry, TpPayout, TpDispute, TpWebhookEvent, TpIdempotencyKey, TpDemoClock

**No foreign keys** between Order.paymentId and TpPayment.id (string correlation only). This preserves bounded contexts at the cost of DB-enforced referential integrity across contexts.

See `database_erd.mmd`.
