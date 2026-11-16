import { localizeDistrictHtml } from "@/lib/district-content";
import type { SitePageContent } from "@/lib/site-content";

export function DistrictContent({
  slug,
  page,
  pages,
}: {
  slug: string;
  page: SitePageContent;
  pages: Record<string, SitePageContent>;
}) {
  const html = localizeDistrictHtml(page.html || "", slug, pages)
    .replace(/<\/?(?:html|body)[^>]*>/gi, "")
    .trim();
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

  if (!text) {
    return (
      <article className="district-page-content">
        <h1>{page.title}</h1>
        <p>This page has no published body on the source district site yet.</p>
      </article>
    );
  }

  return (
    <article className="district-page-content">
      <div className="district-rich" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
