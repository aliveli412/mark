import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <PageBanner title="Checkout" />
      <div className="wrap page prose">
        <p>
          Card payments are still handled by the existing WooCommerce shop. This Next.js shop keeps a basket in the browser and does not take card details.
        </p>
        <p>
          To place an order, use the <Link href="/contact">contact form</Link> and include the items in your basket, or continue on the current store.
        </p>
        <p>
          <a href="https://www.markmastermasons.com/shop/" target="_blank" rel="noreferrer">Open the current MMM Online Store</a>
        </p>
      </div>
    </>
  );
}
