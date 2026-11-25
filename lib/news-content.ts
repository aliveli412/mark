import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

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
  published: boolean;
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

export type NewsPostInput = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  html: string;
  image?: string | null;
  category?: string;
  published: boolean;
  published_at?: string | null;
};

let cache: NewsContentFile | null | undefined;

function newsFilePath() {
  return path.join(process.cwd(), "content", "news.json");
}

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

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slugifyCategory(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function normalizePost(post: Partial<NewsPost> & { slug: string; title: string }): NewsPost {
  const categories = post.categories || [];
  const primary =
    post.primary_category ||
    categories.find((c) => !["uncategorized", "uncategorised"].includes(c.slug)) ||
    categories[0] ||
    null;
  return {
    id: post.id || `news-${post.slug}`,
    slug: post.slug,
    title: decodeEntities(post.title || ""),
    excerpt: decodeEntities(post.excerpt || ""),
    html: post.html || "",
    image: post.image || null,
    categories,
    primary_category: primary,
    published: post.published !== false,
    published_at: post.published_at ?? null,
    modified_at: post.modified_at ?? post.published_at ?? null,
    source: post.source || `/news/${post.slug}`,
    text_chars: post.text_chars ?? stripTags(post.html || "").length,
  };
}

function emptyCatalog(): NewsContentFile {
  return {
    slug: "news",
    base: "https://www.markmastermasons.com/news/",
    name: "Mark News",
    post_count: 0,
    posts: [],
  };
}

export function loadNewsContent(): NewsContentFile | null {
  if (cache !== undefined) return cache;
  const filePath = newsFilePath();
  if (!existsSync(filePath)) {
    cache = null;
    return null;
  }
  const data = JSON.parse(readFileSync(filePath, "utf8")) as NewsContentFile;
  data.posts = (data.posts ?? []).map((post) => normalizePost(post));
  data.post_count = data.posts.length;
  cache = data;
  return data;
}

function persist(data: NewsContentFile) {
  data.post_count = data.posts.length;
  writeFileSync(newsFilePath(), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  cache = data;
}

export function listNewsPosts(includeDrafts = false): NewsPost[] {
  const content = loadNewsContent();
  if (!content) return [];
  return content.posts
    .filter((post) => includeDrafts || post.published)
    .slice()
    .sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));
}

export function listAdminNewsPosts(): NewsPost[] {
  return listNewsPosts(true);
}

export function getNewsPost(slug: string): NewsPost | null {
  return listNewsPosts(false).find((post) => post.slug === slug) ?? null;
}

export function getAdminNewsPost(idOrSlug: string): NewsPost | null {
  return (
    listAdminNewsPosts().find((post) => post.id === idOrSlug || post.slug === idOrSlug) ?? null
  );
}

export function saveNewsPost(input: NewsPostInput): NewsPost {
  const content = loadNewsContent() ?? emptyCatalog();
  const now = new Date().toISOString();
  const categoryName = (input.category || "").trim();
  const category: NewsCategory | null = categoryName
    ? { slug: slugifyCategory(categoryName), name: categoryName }
    : null;

  const existingIndex = input.id
    ? content.posts.findIndex((post) => post.id === input.id)
    : content.posts.findIndex((post) => post.slug === input.slug);

  const previous = existingIndex >= 0 ? content.posts[existingIndex] : null;
  const publishedAt = input.published
    ? input.published_at || previous?.published_at || now
    : input.published_at ?? previous?.published_at ?? null;

  const categories =
    category != null
      ? [
          category,
          ...(previous?.categories || []).filter((c) => c.slug !== category.slug),
        ]
      : previous?.categories || [];

  const next: NewsPost = normalizePost({
    id: previous?.id || input.id || `news-${randomUUID()}`,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    html: input.html,
    image: input.image ?? previous?.image ?? null,
    categories,
    primary_category: category || previous?.primary_category || null,
    published: input.published,
    published_at: publishedAt,
    modified_at: now,
    source: previous?.source || `/news/${input.slug}`,
  });

  if (existingIndex >= 0) content.posts[existingIndex] = next;
  else content.posts.unshift(next);

  content.posts.sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));
  persist(content);
  return next;
}

export function deleteNewsPost(id: string) {
  const content = loadNewsContent();
  if (!content) return false;
  const before = content.posts.length;
  content.posts = content.posts.filter((post) => post.id !== id && post.slug !== id);
  if (content.posts.length === before) return false;
  persist(content);
  return true;
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
