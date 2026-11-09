import type { Metadata } from "next";
import { MarkArticle } from "@/components/MarkArticle";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "Mark Degree" };

export default function MarkDegreePage() {
  return (
    <>
      <PageBanner title="Mark Degree" />
      <div className="wrap page">
        <MarkArticle />
      </div>
    </>
  );
}
