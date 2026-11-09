"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatPrice, products } from "@/lib/site";

export function ShopGrid() {
  const { add } = useCart();
  const [added, setAdded] = useState("");

  return (
    <div className="products">
      {products.map((product) => (
        <article className="product" key={product.slug}>
          <img src={product.image} alt={product.name} />
          <div>
            <h2>{product.name}</h2>
            <p>{formatPrice(product.price)}</p>
            {product.canAdd ? (
              <button
                className="btn"
                type="button"
                onClick={() => {
                  add(product.slug);
                  setAdded(product.name);
                }}
              >
                Add to basket
              </button>
            ) : (
              <span>Read more</span>
            )}
            {added === product.name ? <p className="note">Added to basket.</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
