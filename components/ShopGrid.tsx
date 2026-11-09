"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatPence } from "@/lib/format";
import type { ProductRecord } from "@/lib/types";

export function ShopGrid({ products }: { products: ProductRecord[] }) {
  const { add } = useCart();
  const [added, setAdded] = useState("");

  return (
    <div className="products">
      {products.map((product) => (
        <article className="product" key={product.id}>
          <img src={product.image_path} alt={product.name} />
          <div>
            <h2>{product.name}</h2>
            <p>{formatPence(product.price_pence)}</p>
            <p style={{ fontWeight: 400, color: "#666" }}>{product.description}</p>
            <button
              className="btn"
              type="button"
              onClick={() => {
                add({
                  slug: product.slug,
                  name: product.name,
                  price_pence: product.price_pence,
                  image_path: product.image_path,
                });
                setAdded(product.slug);
              }}
            >
              Add to basket
            </button>
            {added === product.slug ? <p className="note">Added to basket.</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
