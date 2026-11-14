import { existsSync, readFileSync } from "fs";
import path from "path";
import type { SiteContentFile, SitePageContent } from "@/lib/site-content";

export type DistrictContentFile = SiteContentFile & {
  name?: string;
  status?: string;
  page_count?: number;
};

const cache = new Map<string, DistrictContentFile | null>();

export function loadDistrictContent(slug: string): DistrictContentFile | null {
  if (cache.has(slug)) return cache.get(slug) ?? null;
  const filePath = path.join(process.cwd(), "content", "districts", `${slug}.json`);
  if (!existsSync(filePath)) {
    cache.set(slug, null);
    return null;
  }
  const data = JSON.parse(readFileSync(filePath, "utf8")) as DistrictContentFile;
  cache.set(slug, data);
  return data;
}

export function getDistrictPage(slug: string, key: string) {
  return loadDistrictContent(slug)?.pages[key] ?? null;
}

export function listDistrictPageKeys(slug: string) {
  const content = loadDistrictContent(slug);
  if (!content) return [];
  return Object.keys(content.pages).filter((key) => key !== "home");
}

/** Nav items derived from imported page keys (exclude posts noise from primary nav). */
export function districtNavLinks(slug: string) {
  const content = loadDistrictContent(slug);
  if (!content) return [] as Array<{ key: string; title: string; href: string }>;
  return Object.entries(content.pages)
    .filter(([key]) => key !== "home" && !key.startsWith("posts/"))
    .map(([key, page]) => ({
      key,
      title: page.title || key,
      href: `/districts/${slug}/${key}`,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function localizeDistrictHtml(html: string, slug: string, pages: Record<string, SitePageContent>) {
  let out = html;
  for (const [key, page] of Object.entries(pages)) {
    if (!page.source) continue;
    const dest = key === "home" ? `/districts/${slug}` : `/districts/${slug}/${key}`;
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
  // Generic rewrite of remaining absolute district links under this slug.
  out = out.replace(
    new RegExp(`https?://(?:www\\.)?markmastermasons\\.com/${slug}/([^"'\\s>]+)`, "gi"),
    (_m, rest: string) => {
      const clean = String(rest).replace(/\/$/, "");
      return clean ? `/districts/${slug}/${clean}` : `/districts/${slug}`;
    },
  );
  return out;
}
