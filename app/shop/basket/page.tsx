"use client";

import Link from "next/link";
import { PageBanner } from "@/components/PageBanner";
import { useCart } from "@/components/CartProvider";
import { formatPrice, products } from "@/lib/site";

export default function BasketPage() {
  const { lines, setQty, remove } = useCart();
  const detailed = lines
    .map((line) => {
      const product = products.find((item) => item.slug === line.slug);
      return product ? { ...line, product } : null;
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
  const total = detailed.reduce((sum, line) => sum + line.product.price * line.qty, 0);

  return (
    <>
      <PageBanner title="Basket" />
      <div className="wrap page">
        {detailed.length === 0 ? (
          <div className="empty">
            <p>Your basket is empty.</p>
            <Link href="/shop">Return to the shop</Link>
          </div>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {detailed.map((line) => (
                  <tr key={line.slug}>
                    <td>{line.product.name}</td>
                    <td>{formatPrice(line.product.price)}</td>
                    <td>
                      <input
                        className="qty"
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(event) => setQty(line.slug, Number(event.target.value))}
                      />
                    </td>
                    <td>{formatPrice(line.product.price * line.qty)}</td>
                    <td>
                      <button className="btn" type="button" onClick={() => remove(line.slug)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              <strong>Basket total {formatPrice(total)}</strong>
            </p>
            <Link className="btn" href="/shop/checkout">Checkout</Link>
          </>
        )}
      </div>
    </>
  );
}
