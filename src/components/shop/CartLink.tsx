"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

function readCount() {
  try {
    const raw = localStorage.getItem("pb_cart");
    const cart = raw ? (JSON.parse(raw) as Array<{ quantity?: number }>) : [];
    return cart.reduce((sum, item) => sum + (typeof item.quantity === "number" ? item.quantity : 0), 0);
  } catch {
    return 0;
  }
}

export function CartLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(readCount());
    sync();
    window.addEventListener("pb-cart", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("pb-cart", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return (
    <Link href="/cart" className="store-icon" aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}>
      <ShoppingCart className="h-5 w-5" aria-hidden />
      {count > 0 ? <span className="store-cart-count">{count}</span> : null}
    </Link>
  );
}
