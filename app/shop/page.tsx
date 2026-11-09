import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";
import { ShopGrid } from "@/components/ShopGrid";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <>
      <PageBanner title="Shop" />
      <div className="wrap page">
        <p className="lede">MMM Online Store. Online Store shared with Freemasons Without Borders. Showing all 2 results.</p>
        <ShopGrid />
      </div>
    </>
  );
}
