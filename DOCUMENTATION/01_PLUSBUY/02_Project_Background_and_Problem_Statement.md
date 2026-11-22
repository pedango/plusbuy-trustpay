# PlusBuy — Background and Problem Statement

## Business context

PlusBuy models a Ghana-oriented retail demo: prices in GHS (pesewas), Mobile Money networks MTN MoMo, Telecel Cash, and AirtelTigo Money as **checkout options**, and TrustPay as the escrow layer.

The seller is one person with physical stock. When an order is paid into escrow, the merchant marks the order as handed to a rider (`SHIPPED` / UI label “WITH RIDER”). The buyer can confirm **Item received** while the order is still `PAID_IN_ESCROW` or after rider handoff.

## Problem

| Stakeholder | Risk without escrow |
|-------------|---------------------|
| Buyer | Pays and never receives goods |
| Seller | Fulfils and never gets paid |
| Platform | No clear settlement source of truth |

## Solution approach in this repository

1. PlusBuy creates an order and a TrustPay payment (HTTP).
2. Buyer authorises simulated MoMo on TrustPay checkout.
3. TrustPay records HOLD ledger entries and emits `payment.held`.
4. PlusBuy moves the order to `PAID_IN_ESCROW`.
5. Buyer clicks Item received → PlusBuy calls TrustPay release → order `COMPLETED`.
6. Merchant withdraws from `MERCHANT_AVAILABLE` via simulated payout.

## What this is not

This is not a production payment institution. Ledger “escrow” is application-level bookkeeping. Real custody of customer funds in Ghana would require an authorised PSP arrangement (see TrustPay docs and `docs/path-to-production.md` in the repo).
