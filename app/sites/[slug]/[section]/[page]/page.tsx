import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LodgeContent } from "@/components/sites/LodgeContent";
import { getMarkSite, markSites } from "@/lib/mark-sites";
import { getSitePage, loadSiteContent } from "@/lib/site-content";

export async function generateStaticParams() {
  const params: Array<{ slug: string; section: string; page: string }> = [];
  for (const site of markSites) {
    const content = loadSiteContent(site.slug);
    if (content) {
      for (const key of Object.keys(content.pages)) {
        if (!key.includes("/") || key.startsWith("posts/") || key === "home" || key === "contact") continue;
        const [section, page] = key.split("/");
        params.push({ slug: site.slug, section, page });
      }
    } else {
      for (const group of site.nav) {
        for (const link of group.links) {
          params.push({ slug: site.slug, section: group.slug, page: link.slug });
        }
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; section: string; page: string }>;
}): Promise<Metadata> {
  const { slug, section, page } = await params;
  const site = getMarkSite(slug);
  const content = getSitePage(slug, `${section}/${page}`);
  return { title: content?.title || `${page} · ${site?.fullName ?? "Mark Site"}` };
}

export default async function LodgeSectionPage({
  params,
}: {
  params: Promise<{ slug: string; section: string; page: string }>;
}) {
  const { slug, section, page } = await params;
  const site = getMarkSite(slug);
  if (!site) notFound();

  const key = `${section}/${page}`;
  const contentFile = loadSiteContent(slug);
  const pageContent = contentFile?.pages[key];

  if (pageContent) {
    return (
      <LodgeContent
        slug={slug}
        page={pageContent}
        pages={contentFile!.pages}
        emptyNote={site.sourceNote}
      />
    );
  }

  // Fallback for sites without imported JSON
  const group = site.nav.find((item) => item.slug === section);
  const link = group?.links.find((item) => item.slug === page);
  if (!link) notFound();
  return (
    <article className="lodge-page">
      <h1>{link.label}</h1>
      <p>{site.sourceNote || "Content will appear here once imported from the live lodge site."}</p>
    </article>
  );
}
