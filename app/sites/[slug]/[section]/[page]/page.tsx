import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLodgePage, getMarkSite, markSites } from "@/lib/mark-sites";

export async function generateStaticParams() {
  return markSites.flatMap((site) =>
    site.nav.flatMap((group) =>
      (group.links ?? []).map((link) => ({
        slug: site.slug,
        section: group.slug,
        page: link.slug,
      })),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; section: string; page: string }>;
}): Promise<Metadata> {
  const { slug, section, page } = await params;
  const site = getMarkSite(slug);
  if (!site) return { title: "Mark Site" };
  const content = getLodgePage(site, section, page);
  return { title: content ? `${content.title} · ${site.fullName}` : site.fullName };
}

export default async function LodgeSectionPage({
  params,
}: {
  params: Promise<{ slug: string; section: string; page: string }>;
}) {
  const { slug, section, page } = await params;
  const site = getMarkSite(slug);
  if (!site) notFound();
  const content = getLodgePage(site, section, page);
  if (!content) notFound();

  return (
    <article className="lodge-page">
      <h1>{content.title}</h1>
      <p>{content.body}</p>
    </article>
  );
}
