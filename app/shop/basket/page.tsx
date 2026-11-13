"use client";

import Link from "next/link";
import { PageBanner } from "@/components/PageBanner";
import { useCart } from "@/components/CartProvider";
import { formatPence } from "@/lib/format";

export default function BasketPage() {
  const { lines, setQty, remove } = useCart();
  const total = lines.reduce((sum, line) => sum + line.price_pence * line.qty, 0);

  return (
    <>
      <PageBanner title="Basket" />
      <div className="wrap page">
        {lines.length === 0 ? (
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
                {lines.map((line) => (
                  <tr key={line.slug}>
                    <td>{line.name}</td>
                    <td>{formatPence(line.price_pence)}</td>
                    <td>
                      <input
                        className="qty"
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(event) => setQty(line.slug, Number(event.target.value))}
                      />
                    </td>
                    <td>{formatPence(line.price_pence * line.qty)}</td>
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
              <strong>Basket total {formatPence(total)}</strong>
            </p>
            <Link className="btn" href="/shop/checkout">Checkout</Link>
          </>
        )}
      </div>
    </>
  );
}
