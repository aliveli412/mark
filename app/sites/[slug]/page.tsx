import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LodgeHome } from "@/components/sites/LodgeHome";
import { markSites } from "@/lib/mark-sites";
import { getEnrichedMarkSite } from "@/lib/mark-sites-server";

export async function generateStaticParams() {
  return markSites.map((site) => ({ slug: site.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getEnrichedMarkSite(slug);
  return { title: site?.fullName ?? "Mark Site" };
}

export default async function LodgeHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = getEnrichedMarkSite(slug);
  if (!site) notFound();
  return <LodgeHome site={site} />;
}
