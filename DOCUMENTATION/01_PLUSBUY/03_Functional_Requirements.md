# PlusBuy — Functional Requirements

Requirements below reflect **implemented** behaviour verified against the codebase. Status tags: Implemented | Simulated | Partial | Not Implemented.

## Authentication and accounts

| ID | Requirement | Status |
|----|-------------|--------|
| FR-001 | User signs in with email and password | Implemented |
| FR-002 | Session stored as HTTP-only JWT cookie `pb_session` (7 days) | Implemented |
| FR-003 | Failed logins throttled (5 failures / 15 minutes) | Implemented |
| FR-004 | User can sign out | Implemented |
| FR-005 | Public self-registration | Not Implemented |
| FR-006 | Password reset | Not Implemented |

## Product browsing

| ID | Requirement | Status |
|----|-------------|--------|
| FR-010 | List active products | Implemented |
| FR-011 | Search products by name (`?q=`) | Implemented |
| FR-012 | View product detail and related products | Implemented |
| FR-013 | Product image or colour swatch fallback | Implemented |
| FR-014 | Advanced filters (price, category, variants) | Not Implemented |

## Cart and checkout

| ID | Requirement | Status |
|----|-------------|--------|
| FR-020 | Add product to cart (client `localStorage` `pb_cart`) | Implemented |
| FR-021 | Multiple distinct products in one cart | Implemented |
| FR-022 | Multiple quantities of the same product | Implemented |
| FR-023 | Update quantity and remove line items | Implemented |
| FR-024 | Checkout creates server order + TrustPay payment | Implemented |
| FR-025 | Checkout requires BUYER session | Implemented |
| FR-026 | Stock decremented on order create | Implemented |
| FR-027 | Product variants (size/colour SKUs) | Not Implemented |
| FR-028 | Server-side persisted cart | Not Implemented |

## Orders (buyer)

| ID | Requirement | Status |
|----|-------------|--------|
| FR-030 | Buyer lists own orders | Implemented |
| FR-031 | Buyer views order detail and timeline | Implemented |
| FR-032 | Buyer confirms Item received from `PAID_IN_ESCROW` or `SHIPPED` | Implemented |
| FR-033 | Confirming receipt releases TrustPay payment then completes order | Implemented |
| FR-034 | Buyer cancels unpaid or escrow-held order | Implemented |
| FR-035 | Buyer reports problem (opens TrustPay dispute) from escrow/shipped | Implemented |
| FR-036 | Stale pending payment reconciled against TrustPay | Implemented |

## Merchant

| ID | Requirement | Status |
|----|-------------|--------|
| FR-040 | Merchant dashboard (balances, recent orders, ledger snippet) | Implemented |
| FR-041 | Create product (name, description, GHS price, colour, stock, image) | Implemented |
| FR-042 | Update product stock, active flag, optional image | Implemented |
| FR-043 | Delete product permanently | Not Implemented |
| FR-044 | Mark paid order handed to rider (`SHIPPED`) | Implemented |
| FR-045 | Cancel eligible orders | Implemented |
| FR-046 | View TrustPay ledger | Implemented |
| FR-047 | Create MoMo payout from available balance | Implemented (simulated payout) |
| FR-048 | List payouts | Implemented |

## Landing / marketing

| ID | Requirement | Status |
|----|-------------|--------|
| FR-050 | Landing with featured products and TrustPay messaging | Implemented |
| FR-051 | Contact form / ticket system | Not Implemented (static links only) |

## Classification notes

- Cart is **client-side until checkout**; order line items are server truth after `POST /api/shop/orders`.
- Payment collection is **Simulated** at TrustPay; PlusBuy correctly treats held/released/refunded statuses via webhooks and API calls.
- Merchant “ship” does **not** call TrustPay `recordShipment` in the current code path.
