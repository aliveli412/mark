import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type NewsCategory = {
  slug: string;
  name: string;
  parent?: string | null;
  description?: string;
};

export type NewsTag = {
  slug: string;
  name: string;
};

export type NewsSeo = {
  title: string;
  description: string;
  keywords: string;
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
  tags: NewsTag[];
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
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

export type NewsTaxonomyFile = {
  imported_at?: string;
  source?: string;
  categories: NewsCategory[];
  tags: NewsTag[];
};

export type NewsPostInput = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  html: string;
  image?: string | null;
  categorySlugs?: string[];
  tagNames?: string[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  published: boolean;
  published_at?: string | null;
};

let cache: NewsContentFile | null | undefined;
let taxonomyCache: NewsTaxonomyFile | null | undefined;

function newsFilePath() {
  return path.join(process.cwd(), "content", "news.json");
}

function taxonomyFilePath() {
  return path.join(process.cwd(), "content", "news-taxonomy.json");
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

export function slugifyTerm(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeCategory(cat: Partial<NewsCategory> & { slug: string; name: string }): NewsCategory {
  return {
    slug: cat.slug,
    name: decodeEntities(cat.name || cat.slug),
    parent: cat.parent ?? null,
    description: cat.description || "",
  };
}

function normalizeTag(tag: Partial<NewsTag> & { slug?: string; name: string }): NewsTag {
  const name = decodeEntities(tag.name || "");
  return {
    slug: tag.slug || slugifyTerm(name),
    name,
  };
}

function normalizePost(post: Partial<NewsPost> & { slug: string; title: string }): NewsPost {
  const categories = (post.categories || []).map((c) => normalizeCategory(c));
  const tags = (post.tags || []).map((t) => normalizeTag(t));
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
    primary_category: primary ? normalizeCategory(primary) : null,
    tags,
    seo_title: decodeEntities(post.seo_title || ""),
    seo_description: decodeEntities(post.seo_description || ""),
    seo_keywords: decodeEntities(post.seo_keywords || ""),
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

export function loadNewsTaxonomy(): NewsTaxonomyFile {
  if (taxonomyCache !== undefined) return taxonomyCache ?? { categories: [], tags: [] };
  const filePath = taxonomyFilePath();
  if (!existsSync(filePath)) {
    taxonomyCache = { categories: [], tags: [] };
    return taxonomyCache;
  }
  const data = JSON.parse(readFileSync(filePath, "utf8")) as NewsTaxonomyFile;
  taxonomyCache = {
    ...data,
    categories: (data.categories || []).map((c) => normalizeCategory(c)),
    tags: (data.tags || []).map((t) => normalizeTag(t)),
  };
  return taxonomyCache;
}

export function listTaxonomyCategories(): NewsCategory[] {
  return loadNewsTaxonomy().categories.slice();
}

export function listTaxonomyTags(): NewsTag[] {
  return loadNewsTaxonomy().tags.slice();
}

/** Flattened category options with indented labels for admin selects. */
export function listCategoryOptions(): Array<NewsCategory & { label: string; depth: number }> {
  const cats = listTaxonomyCategories();
  const bySlug = new Map(cats.map((c) => [c.slug, c]));

  function depthOf(slug: string, seen = new Set<string>()): number {
    const cat = bySlug.get(slug);
    if (!cat?.parent || seen.has(slug)) return 0;
    seen.add(slug);
    return 1 + depthOf(cat.parent, seen);
  }

  function pathLabel(slug: string): string {
    const parts: string[] = [];
    let cur: string | null | undefined = slug;
    const seen = new Set<string>();
    while (cur && bySlug.has(cur) && !seen.has(cur)) {
      seen.add(cur);
      const cat: NewsCategory | undefined = bySlug.get(cur);
      if (!cat) break;
      parts.unshift(cat.name);
      cur = cat.parent;
    }
    return parts.join(" › ");
  }

  return cats
    .map((cat) => ({
      ...cat,
      depth: depthOf(cat.slug),
      label: pathLabel(cat.slug),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
}

export function resolveCategories(slugs: string[]): NewsCategory[] {
  const bySlug = new Map(listTaxonomyCategories().map((c) => [c.slug, c]));
  const out: NewsCategory[] = [];
  for (const slug of slugs) {
    const clean = slug.trim();
    if (!clean) continue;
    const known = bySlug.get(clean);
    if (known) out.push(known);
    else out.push({ slug: clean, name: clean, parent: null });
  }
  return out;
}

export function resolveTags(names: string[]): NewsTag[] {
  const bySlug = new Map(listTaxonomyTags().map((t) => [t.slug, t]));
  const byName = new Map(listTaxonomyTags().map((t) => [t.name.toLowerCase(), t]));
  const out: NewsTag[] = [];
  const seen = new Set<string>();
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const known = bySlug.get(slugifyTerm(name)) || byName.get(name.toLowerCase());
    const tag = known || { slug: slugifyTerm(name), name };
    if (seen.has(tag.slug)) continue;
    seen.add(tag.slug);
    out.push(tag);
  }
  return out;
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

  const existingIndex = input.id
    ? content.posts.findIndex((post) => post.id === input.id)
    : content.posts.findIndex((post) => post.slug === input.slug);

  const previous = existingIndex >= 0 ? content.posts[existingIndex] : null;
  const publishedAt = input.published
    ? input.published_at || previous?.published_at || now
    : input.published_at ?? previous?.published_at ?? null;

  const categories =
    input.categorySlugs != null
      ? resolveCategories(input.categorySlugs)
      : previous?.categories || [];
  const tags =
    input.tagNames != null ? resolveTags(input.tagNames) : previous?.tags || [];
  const primary =
    categories.find((c) => !["uncategorized", "uncategorised"].includes(c.slug)) ||
    categories[0] ||
    null;

  const next: NewsPost = normalizePost({
    id: previous?.id || input.id || `news-${randomUUID()}`,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    html: input.html,
    image: input.image ?? previous?.image ?? null,
    categories,
    primary_category: primary,
    tags,
    seo_title: input.seo_title ?? previous?.seo_title ?? "",
    seo_description: input.seo_description ?? previous?.seo_description ?? "",
    seo_keywords: input.seo_keywords ?? previous?.seo_keywords ?? "",
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

export function newsSeo(post: NewsPost): NewsSeo {
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || stripTags(post.html).slice(0, 160),
    keywords:
      post.seo_keywords ||
      [...post.categories.map((c) => c.name), ...post.tags.map((t) => t.name)].join(", "),
  };
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
