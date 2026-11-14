import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";
import { ProvinceDirectory } from "@/components/ProvinceDirectory";

export const metadata: Metadata = { title: "Grand Lodges" };

export default function GrandLodgesPage() {
  return (
    <>
      <PageBanner title="Grand Lodges" />
      <div className="wrap page">
        <p>Grand &amp; District Lodges of Mark Master Masons.</p>
        <p>Blue markers on the map open each published district site. You can also search the list below.</p>
        <ProvinceDirectory />
      </div>
    </>
  );
}
