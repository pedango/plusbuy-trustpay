# PlusBuy — Component Architecture

## Frontend components (selected)

| Component | Path | Role |
|-----------|------|------|
| `LandingHeader` | `src/components/shop/LandingHeader.tsx` | Landing nav, search form, account, cart |
| `CartLink` | `src/components/shop/CartLink.tsx` | Cart badge from `localStorage` |
| `ShopHeader` | `src/components/shop/ShopHeader.tsx` | Header for shop layout pages |
| `SessionMenu` | `src/components/shop/SessionMenu.tsx` | Sign in / orders / sign out from server session |
| `ProductCard` | `src/components/shop/ProductCard.tsx` | Catalog card + add to cart |
| `ProductMedia` | `src/components/shop/ProductMedia.tsx` | Image or colour swatch |
| `AddToCartButton` | `src/components/shop/AddToCartButton.tsx` | Writes `pb_cart` |
| `OrderActions` | `src/app/(shop)/orders/[id]/OrderActions.tsx` | Item received, cancel, report problem |
| `MerchantActions` | `src/app/(merchant)/merchant/orders/[id]/MerchantActions.tsx` | Rider handoff, cancel |
| `ProductCreateForm` / `ProductEditor` | merchant products | Create / patch products |

## Domain / services

| Module | Path | Role |
|--------|------|------|
| Order machine | `src/modules/shop/domain/order.machine.ts` | Legal status transitions |
| Order service | `src/modules/shop/services/order.service.ts` | Transitions, webhook apply, reconcile, order codes |
| Auth | `src/lib/auth.ts` | Login / throttle |
| Session | `src/lib/session.ts` | JWT cookie |
| Authz | `src/lib/authz.ts` | Role helpers, same-origin |
| Money | `src/lib/money.ts` | GHS formatting helpers used by UI |

## Layouts

- Shop layout: `src/app/(shop)/layout.tsx` (`force-dynamic`) + `ShopHeader`
- Merchant layout: `src/app/(merchant)/merchant/layout.tsx` sidebar nav
- Root landing: `src/app/page.tsx` (no shop layout; uses `LandingHeader`)
