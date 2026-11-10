"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageBanner } from "@/components/PageBanner";
import { useCart } from "@/components/CartProvider";

export default function CheckoutSuccessPage() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <>
      <PageBanner title="Payment received" />
      <div className="wrap page prose">
        <p>Thank you. Your Stripe payment completed successfully. A receipt will come from Stripe to the email you used at checkout.</p>
        <p>
          <Link href="/shop">Back to shop</Link>
        </p>
      </div>
    </>
  );
}
