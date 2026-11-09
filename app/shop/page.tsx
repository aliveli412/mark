import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";
import { ShopGrid } from "@/components/ShopGrid";
import { listActiveProducts, usingSampleData } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage() {
  const products = await listActiveProducts();
  return (
    <>
      <PageBanner title="Shop" />
      <div className="wrap page">
        <p className="lede">
          MMM Online Store. Showing {products.length} {products.length === 1 ? "result" : "results"}.
          {usingSampleData() ? " Catalogue is on sample data until Supabase is connected." : ""}
        </p>
        <ShopGrid products={products} />
      </div>
    </>
  );
}
