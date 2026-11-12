"use client";

import Image from "next/image";
import { useState } from "react";

type Brand = "plusbuy" | "trustpay";
type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, { width: number; height: number; className: string }> = {
  sm: { width: 120, height: 36, className: "h-7 w-auto" },
  md: { width: 168, height: 48, className: "h-10 w-auto" },
  lg: { width: 240, height: 72, className: "h-14 w-auto" },
};

const brandMeta: Record<
  Brand,
  { label: string; src: string; textClass: string }
> = {
  plusbuy: {
    label: "PlusBuy",
    src: "/brand/plusbuy-logo.jpg",
    textClass: "text-[var(--shop-navy)]",
  },
  trustpay: {
    label: "TrustPay",
    src: "/brand/trustpay-logo.jpg",
    textClass: "text-[var(--tp-brand-dark)]",
  },
};

/**
 * Brand mark for PlusBuy or TrustPay. Falls back to a text wordmark if the image fails.
 */
export function BrandLogo({
  brand,
  size = "md",
  className = "",
}: {
  brand: Brand;
  size?: Size;
  className?: string;
}) {
  const meta = brandMeta[brand];
  const dims = sizeMap[size];
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <BrandWordmark brand={brand} className={`${dims.className} ${className}`} />;
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src={meta.src}
        alt={`${meta.label} logo`}
        width={dims.width}
        height={dims.height}
        className={`${dims.className} object-contain`}
        priority={size === "lg"}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

/** Text-only wordmark used when an image asset is unavailable. */
export function BrandWordmark({ brand, className = "" }: { brand: Brand; className?: string }) {
  const meta = brandMeta[brand];
  return (
    <span
      className={`font-semibold tracking-tight ${meta.textClass} ${className}`}
      aria-label={meta.label}
    >
      {meta.label}
    </span>
  );
}
