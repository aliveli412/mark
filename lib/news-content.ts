import { existsSync, readFileSync } from "fs";
import path from "path";

export type NewsCategory = {
  slug: string;
  name: string;
};

export type NewsPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  html: string;
  image: string | null;
  categories: NewsCategory[];
  primary_category: NewsCategory | null;
  published_at: string | null;
  modified_at: string | null;
  source: string;
  text_chars?: number;
};

export type NewsContentFile = {
  slug: string;
  base: string;
  name: string;
  imported_at?: string;
  post_count: number;
  posts: NewsPost[];
};

let cache: NewsContentFile | null | undefined;

function decodeEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function loadNewsContent(): NewsContentFile | null {
  if (cache !== undefined) return cache;
  const filePath = path.join(process.cwd(), "content", "news.json");
  if (!existsSync(filePath)) {
    cache = null;
    return null;
  }
  const data = JSON.parse(readFileSync(filePath, "utf8")) as NewsContentFile;
  data.posts = (data.posts ?? []).map((post) => ({
    ...post,
    title: decodeEntities(post.title || ""),
    excerpt: decodeEntities(post.excerpt || ""),
    image: post.image || null,
    categories: post.categories || [],
    primary_category: post.primary_category || null,
  }));
  cache = data;
  return data;
}

export function listNewsPosts(): NewsPost[] {
  const content = loadNewsContent();
  if (!content) return [];
  return content.posts
    .slice()
    .sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));
}

export function getNewsPost(slug: string): NewsPost | null {
  return listNewsPosts().find((post) => post.slug === slug) ?? null;
}

export function formatNewsDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

/** Live Mark News theme shows the last-modified date when posts were updated. */
export function newsDisplayDate(post: Pick<NewsPost, "published_at" | "modified_at">) {
  const published = post.published_at || "";
  const modified = post.modified_at || "";
  if (modified && modified > published) return modified;
  return published || modified || null;
}

/** Rewrite absolute Mark News links to portal /news paths. */
export function localizeNewsHtml(html: string, posts: NewsPost[]) {
  let out = html;
  for (const post of posts) {
    if (!post.source) continue;
    const dest = `/news/${post.slug}`;
    const variants = [
      post.source,
      post.source.replace(/\/$/, ""),
      post.source.replace("https://www.", "https://"),
      post.source.replace("https://markmastermasons.com", "https://www.markmastermasons.com"),
      post.source.replace("https://www.markmastermasons.com", "https://markmastermasons.com"),
    ];
    for (const src of variants) {
      out = out.split(`href="${src}"`).join(`href="${dest}"`);
      out = out.split(`href="${src}/"`).join(`href="${dest}"`);
    }
  }
  out = out.replace(
    /https?:\/\/(?:www\.)?markmastermasons\.com\/news\/([^"'?\s#]+?)(?:\.html)?\/?(?=["'#?\s])/gi,
    (_m, rest: string) => {
      const clean = String(rest).replace(/\/$/, "").replace(/\.html$/i, "");
      if (!clean || clean === "category" || clean.startsWith("category/")) return _m;
      return `/news/${clean}`;
    },
  );
  return out;
}
