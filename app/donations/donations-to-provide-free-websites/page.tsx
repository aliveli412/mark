import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "Donations" };

export default function DonationsPage() {
  return (
    <>
      <PageBanner title="Donations to provide free websites" />
      <div className="wrap page prose">
        <p>
          Our aim is to provide a free website for every lodge: a website where there will be no maintenance issues, updates or security work for the lodge to manage. The portal also aims to offer festive board and other event tools, digital summons and minutes, free of charge.
        </p>
        <p>
          The footer of the current site links here. That address does not publish a working donation form. Gifts are not being taken on this page.
        </p>
        <p>
          Lodges can compare what is included on the <Link href="/packages">packages</Link> page, or <Link href="/contact">send an enquiry</Link>.
        </p>
      </div>
    </>
  );
}
