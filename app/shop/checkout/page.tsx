import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <PageBanner title="Checkout" />
      <div className="wrap page">
        <p className="lede">Review your basket and pay securely with Stripe.</p>
        <CheckoutForm />
      </div>
    </>
  );
}
