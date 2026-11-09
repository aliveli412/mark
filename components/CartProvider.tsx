"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  slug: string;
  name: string;
  price_pence: number;
  image_path: string;
  qty: number;
};

type CartValue = {
  lines: CartLine[];
  count: number;
  add: (product: Omit<CartLine, "qty">) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);
const storageKey = "mmm-basket-v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as CartLine[];
      if (Array.isArray(parsed)) setLines(parsed.filter((line) => line.qty > 0));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(lines));
  }, [lines]);

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.qty, 0);
    return {
      lines,
      count,
      add(product) {
        setLines((current) => {
          const existing = current.find((line) => line.slug === product.slug);
          if (!existing) return [...current, { ...product, qty: 1 }];
          return current.map((line) =>
            line.slug === product.slug ? { ...line, qty: line.qty + 1 } : line,
          );
        });
      },
      setQty(slug, qty) {
        setLines((current) =>
          qty <= 0
            ? current.filter((line) => line.slug !== slug)
            : current.map((line) => (line.slug === slug ? { ...line, qty } : line)),
        );
      },
      remove(slug) {
        setLines((current) => current.filter((line) => line.slug !== slug));
      },
      clear() {
        setLines([]);
      },
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
