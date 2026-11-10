import { notFound } from "next/navigation";
import { LodgeShell } from "@/components/sites/LodgeShell";
import { getMarkSite } from "@/lib/mark-sites";

export default async function LodgeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getMarkSite(slug);
  if (!site) notFound();
  return <LodgeShell site={site}>{children}</LodgeShell>;
}
