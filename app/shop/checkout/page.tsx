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
          The catalogue and basket are live. Card checkout will use Stripe once payment secrets are connected; membership dues will share the same Stripe account later.
        </p>
        <p>
          For now, send an order through the <Link href="/contact">contact form</Link> with the items in your basket, or continue browsing the <Link href="/shop">shop</Link>.
        </p>
      </div>
    </>
  );
}
