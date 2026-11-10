import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LodgeContent } from "@/components/sites/LodgeContent";
import { getMarkSite, markSites } from "@/lib/mark-sites";
import { loadSiteContent } from "@/lib/site-content";

export async function generateStaticParams() {
  return markSites.flatMap((site) => {
    const content = loadSiteContent(site.slug);
    if (!content) return [];
    return Object.keys(content.pages)
      .filter((key) => key.startsWith("posts/"))
      .map((key) => ({ slug: site.slug, post: key.slice("posts/".length) }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; post: string }>;
}): Promise<Metadata> {
  const { slug, post } = await params;
  const page = loadSiteContent(slug)?.pages[`posts/${post}`];
  return { title: page?.title ?? "Article" };
}

export default async function LodgePostPage({
  params,
}: {
  params: Promise<{ slug: string; post: string }>;
}) {
  const { slug, post } = await params;
  const site = getMarkSite(slug);
  const content = loadSiteContent(slug);
  const page = content?.pages[`posts/${post}`];
  if (!site || !content || !page) notFound();
  return <LodgeContent slug={slug} page={page} pages={content.pages} />;
}
