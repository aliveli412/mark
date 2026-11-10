import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LodgeHome } from "@/components/sites/LodgeHome";
import { getMarkSite } from "@/lib/mark-sites";

export async function generateStaticParams() {
  const { markSites } = await import("@/lib/mark-sites");
  return markSites.map((site) => ({ slug: site.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getMarkSite(slug);
  return { title: site?.fullName ?? "Mark Site" };
}

export default async function LodgeHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = getMarkSite(slug);
  if (!site) notFound();
  return <LodgeHome site={site} />;
}
