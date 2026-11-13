import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";
import { ProvinceDirectory } from "@/components/ProvinceDirectory";

export const metadata: Metadata = { title: "Grand Lodges" };

export default function GrandLodgesPage() {
  return (
    <>
      <PageBanner title="Grand Lodges" />
      <div className="wrap page">
        <p>Grand & District Lodges of Mark Master Masons will be listed here.</p>
        <p>These are the lodges already marked on the portal map:</p>
        <ProvinceDirectory />
      </div>
    </>
  );
}
