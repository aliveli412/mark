import type { Metadata } from "next";
import { MarkArticle } from "@/components/MarkArticle";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "What is Mark degree?" };

export default function WhatIsMarkDegreePage() {
  return (
    <>
      <PageBanner title="What is Mark degree?" />
      <div className="wrap page">
        <MarkArticle />
      </div>
    </>
  );
}
