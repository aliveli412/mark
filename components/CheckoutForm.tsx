"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatPence } from "@/lib/format";

export function CheckoutForm() {
  const { lines, clear } = useCart();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);
  const total = lines.reduce((sum, line) => sum + line.price_pence * line.qty, 0);

  useEffect(() => {
    fetch("/api/checkout")
      .then((response) => response.json())
      .then((data: { stripeConfigured?: boolean }) => setStripeReady(Boolean(data.stripeConfigured)))
      .catch(() => setStripeReady(false));
  }, []);

  if (lines.length === 0) {
    return (
      <div className="empty">
        <p>Your basket is empty.</p>
        <Link href="/shop">Return to the shop</Link>
      </div>
    );
  }

  async function pay() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items: lines.map((line) => ({ slug: line.slug, qty: line.qty })),
        }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error || "Checkout failed.");
        setPending(false);
        return;
      }
      clear();
      window.location.href = data.url;
    } catch {
      setError("Could not reach the payment service.");
      setPending(false);
    }
  }

  return (
    <div className="checkout-wrap">
      <div className="checkout-summary">
        <h2>Order summary</h2>
        <ul className="checkout-lines">
          {lines.map((line) => (
            <li key={line.slug}>
              <span>
                {line.name} × {line.qty}
              </span>
              <strong>{formatPence(line.price_pence * line.qty)}</strong>
            </li>
          ))}
        </ul>
        <p className="checkout-total">
          Total <strong>{formatPence(total)}</strong>
        </p>
        <Link href="/shop/basket">Edit basket</Link>
      </div>

      <div className="checkout-pay">
        <h2>Pay with Stripe</h2>
        {stripeReady === false ? (
          <p className="error">
            Stripe is not configured yet. Add <code>STRIPE_SECRET_KEY</code> to <code>.env.local</code>{" "}
            and restart the app.
          </p>
        ) : (
          <>
            <label>
              Email for receipt
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button className="btn" type="button" disabled={pending || !email} onClick={pay}>
              {pending ? "Redirecting…" : "Continue to Stripe"}
            </button>
            <p className="note">Cards are processed securely by Stripe Checkout. We never see your card number.</p>
          </>
        )}
      </div>
    </div>
  );
}
