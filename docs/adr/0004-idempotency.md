# ADR 0004: Idempotency keys

Every mutating merchant call requires `Idempotency-Key`, scoped to the merchant. The key, the request hash, and the response are stored in the same database transaction as the effect. A repeat with the same body returns the stored response. A repeat with a different body is `422 idempotency_key_reuse`. This covers double-clicks on release, refund, and payout.
