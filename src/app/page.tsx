import Link from "next/link";
import { ArrowRight, BadgeCheck, Headphones, LockKeyhole, ShieldCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatGhs } from "@/lib/money";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { LandingHeader } from "@/components/shop/LandingHeader";
import { ProductMedia } from "@/components/shop/ProductMedia";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const faqs = [
  {
    q: "When does the seller get paid?",
    a: "After you click Item received. Until then TrustPay holds the payment.",
  },
  {
    q: "Does the seller ship the item?",
    a: "The item is already in the shop. When an order comes in, the seller hands it to a rider.",
  },
  {
    q: "Is the payment prompt on my SIM?",
    a: "In this demo the prompt stays in the browser. No real money leaves the number you type.",
  },
];

export default async function HomePage() {
  const session = await getSession();
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      name: true,
      priceMinor: true,
      imageUrl: true,
      colorHex: true,
    },
  });

  return (
    <div className="store" id="top">
      <LandingHeader />

      <section className="store-hero">
        <div className="store-hero-copy">
          <h1>
            Shop Smart.
            <span> Pay Safe.</span>
          </h1>
          <p>Discover quality products and enjoy secure payments with PlusBuy.</p>
          <Link href="/products" className="store-cta">
            Start Shopping <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="store-hero-art" aria-hidden>
          <div className="store-blob store-blob-orange" />
          <div className="store-blob store-blob-navy" />
          <div className="store-bag store-bag-back" />
          <div className="store-bag store-bag-front" />
          <div className="store-phone">
            <div className="store-phone-bar" />
            <BrandLogo brand="plusbuy" size="sm" />
            <p>Shop More. Pay Safe.</p>
          </div>
        </div>
      </section>

      <section className="store-trust" aria-label="Why PlusBuy">
        <article>
          <ShieldCheck aria-hidden />
          <div>
            <strong>Secure Payments</strong>
            <span>Powered by TrustPay</span>
          </div>
        </article>
        <article>
          <Truck aria-hidden />
          <div>
            <strong>Fast Delivery</strong>
            <span>A rider collects from the shop</span>
          </div>
        </article>
        <article>
          <Headphones aria-hidden />
          <div>
            <strong>Item received</strong>
            <span>You release the payment</span>
          </div>
        </article>
        <article>
          <BadgeCheck aria-hidden />
          <div>
            <strong>Trusted Shop</strong>
            <span>Held until you confirm</span>
          </div>
        </article>
      </section>

      <section className="store-section">
        <div className="store-section-head">
          <div>
            <h2>Our Featured Products</h2>
            <p>Top picks, great prices</p>
          </div>
          <Link href="/products">
            View All Products <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="card">
            <p className="text-[var(--muted)]">Products from the shop will show here.</p>
          </div>
        ) : (
          <div className="store-products">
            {products.map((product) => (
              <article key={product.id} className="store-product">
                <Link href={`/products/${product.id}`} className="store-product-media">
                  <ProductMedia
                    imageUrl={product.imageUrl}
                    colorHex={product.colorHex}
                    name={product.name}
                    fit="contain"
                    className="h-full w-full"
                  />
                </Link>
                <Link href={`/products/${product.id}`} className="store-product-name">
                  {product.name}
                </Link>
                <p className="store-product-price">{formatGhs(product.priceMinor)}</p>
                <AddToCartButton
                  pill
                  productId={product.id}
                  name={product.name}
                  priceMinor={product.priceMinor}
                  colorHex={product.colorHex}
                  imageUrl={product.imageUrl}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="store-confidence">
        <div className="store-confidence-copy">
          <span className="store-confidence-icon">
            <LockKeyhole aria-hidden />
          </span>
          <div>
            <h2>Shop with Confidence</h2>
            <p>
              Your payment is held securely in escrow with TrustPay and released to the seller only after you
              confirm receipt.
            </p>
          </div>
        </div>
        <BrandLogo brand="trustpay" size="md" />
      </section>

      <section className="store-info">
        <article id="about">
          <h2>About</h2>
          <p>
            PlusBuy lists items that are already in the seller’s shop. You pay through TrustPay, the seller hands
            the item to a rider, and the money moves when you click Item received.
          </p>
        </article>
        <article id="faqs">
          <h2>FAQs</h2>
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </article>
        <article id="contact">
          <h2>Contact</h2>
          {session ? (
            <p>You are signed in as {session.name}.</p>
          ) : (
            <p>Sign in to shop, or open the merchant tools if you are posting items from the shop.</p>
          )}
          <div className="store-info-links">
            <Link href={session ? "/orders" : "/login"}>{session ? "Your orders" : "Sign in"}</Link>
            <Link href="/merchant">Merchant</Link>
          </div>
        </article>
      </section>

      <section className="store-ready">
        <div>
          <h2>Ready to shop?</h2>
          <p>Your money stays in TrustPay until you click Item received.</p>
        </div>
        <Link href="/products" className="store-cta">
          Shop Now <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
