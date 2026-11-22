# PlusBuy — Project Overview

## Introduction

PlusBuy is a Next.js e-commerce demo for a single physical shop that lists inventory online. Buyers pay through TrustPay escrow. Funds stay held until the buyer confirms the item was received (or an admin resolves a dispute).

## Background

The seller already holds stock in a shop. Orders are fulfilled by handing items to a rider rather than a warehouse shipping pipeline. The product focuses on escrow-protected checkout rather than a full marketplace.

## Problem statement

Online buyers risk paying before delivery. Sellers risk shipping without payment certainty. PlusBuy + TrustPay demonstrate safeguarded settlement: collect (simulated) MoMo payment, hold in ledger escrow, release to the merchant only after buyer confirmation or dispute resolution.

## Proposed solution (as implemented)

- Shopfront with product catalog, search, client cart, and TrustPay checkout.
- Merchant tools for products, rider handoff, ledger, and MoMo payouts.
- TrustPay simulated MoMo + double-entry ledger + signed webhooks back to PlusBuy.

## Aim and objectives

| Objective | Status |
|-----------|--------|
| Multi-item cart checkout with TrustPay | Implemented |
| Escrow hold until Item received | Implemented (simulated funds) |
| Merchant order and product management | Implemented |
| Dispute open / admin resolve | Implemented |
| Live carrier MoMo | Not implemented |

## Scope

**In scope:** Buyer shop, merchant dashboard, TrustPay integration client, order state machine, webhook consumption, reconcile cron.

**Out of scope (current repo):** Multi-seller marketplace, buyer registration, live payment rails, licensed escrow custody, KYC.

## System limitations

- Demo authentication only (seeded users; no public signup).
- Mobile Money approval is an in-browser PIN prompt, not a SIM push.
- Auto-release after shipment is available on TrustPay’s API but PlusBuy does not call `recordShipment` in the current rider-handoff flow.
- Images may be stored as data URLs on `Product.imageUrl`.

## Target users

| Role | Who |
|------|-----|
| BUYER | Customer (demo: John) |
| MERCHANT | Shop owner |
| TRUSTPAY_ADMIN | TrustPay operator (separate admin UI) |

## Expected benefits

Buyers see escrow protection. Merchants see held vs available balances and can withdraw. Engineers can study bounded-context escrow design in one deployable app.
