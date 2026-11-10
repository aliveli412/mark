import { readFileSync, existsSync } from "fs";
import path from "path";

export type SitePageContent = {
  title: string;
  source: string;
  status: number;
  html: string;
  text_chars: number;
  meta?: {
    countdown_label?: string;
    posts?: Array<{ title: string; category: string; image: string; source?: string }>;
    phone?: string;
    address_lines?: string[];
  };
};

export type SiteContentFile = {
  slug: string;
  base: string;
  pages: Record<string, SitePageContent>;
};

const cache = new Map<string, SiteContentFile | null>();

export function loadSiteContent(slug: string): SiteContentFile | null {
  if (cache.has(slug)) return cache.get(slug) ?? null;
  const filePath = path.join(process.cwd(), "content", "sites", `${slug}.json`);
  if (!existsSync(filePath)) {
    cache.set(slug, null);
    return null;
  }
  const data = JSON.parse(readFileSync(filePath, "utf8")) as SiteContentFile;
  cache.set(slug, data);
  return data;
}

export function getSitePage(slug: string, key: string) {
  const content = loadSiteContent(slug);
  return content?.pages[key] ?? null;
}

export function listContentKeys(slug: string) {
  const content = loadSiteContent(slug);
  return content ? Object.keys(content.pages) : [];
}

/** Rewrite leftover absolute WP lodge links to local /sites paths when possible. */
export function localizeHtml(html: string, slug: string, pages: Record<string, SitePageContent>) {
  let out = html;
  for (const [key, page] of Object.entries(pages)) {
    if (!page.source) continue;
    const dest =
      key === "home"
        ? `/sites/${slug}`
        : key === "contact"
          ? `/sites/${slug}/contact`
          : key.startsWith("posts/")
            ? `/sites/${slug}/${key}`
            : `/sites/${slug}/${key}`;
    const variants = [
      page.source,
      page.source.replace(/\/$/, ""),
      page.source.replace("https://www.", "https://"),
      page.source.replace("https://markmastermasons.com", "https://www.markmastermasons.com"),
      page.source.replace("https://www.markmastermasons.com", "https://markmastermasons.com"),
    ];
    for (const src of variants) {
      out = out.split(`href="${src}"`).join(`href="${dest}"`);
      out = out.split(`href="${src}/"`).join(`href="${dest}"`);
    }
  }
  return out;
}
