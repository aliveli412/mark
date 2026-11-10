import { localizeHtml, type SitePageContent } from "@/lib/site-content";

export function LodgeContent({
  slug,
  page,
  pages,
  emptyNote,
}: {
  slug: string;
  page: SitePageContent;
  pages: Record<string, SitePageContent>;
  emptyNote?: string;
}) {
  const html = localizeHtml(page.html || "", slug, pages);
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

  if (!text) {
    return (
      <article className="lodge-page">
        <h1>{page.title}</h1>
        <p>{emptyNote || "This page has no published body content on the source site yet."}</p>
      </article>
    );
  }

  return (
    <article className="lodge-page">
      <div className="lodge-rich" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
