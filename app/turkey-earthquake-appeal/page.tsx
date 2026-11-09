import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "Turkey Earthquake Appeal" };

export default function AppealPage() {
  return (
    <>
      <PageBanner title="Turkey Earthquake Appeal" />
      <div className="wrap page prose">
        <img src="/images/turkey.jpg" alt="Rescue work in Diyarbakır after the 2023 earthquakes" />
        <p>
          This page on the WordPress site shows the Turkey Earthquake Appeal photograph, a GiveWP donation form and a donor wall. The donor names and the payment form are stored in the plugin, so they are not on the public page.
        </p>
        <p>
          <Link href="/contact">Contact the portal</Link> if you want to be put in touch about the appeal. Online donations will be connected when the GiveWP export and payment settings are available.
        </p>
      </div>
    </>
  );
}
