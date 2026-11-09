import data from "@/content/posts.json";

export type Post = {
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  body: string;
};

export const posts: Post[] = data as Post[];

export function formatPostDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

export function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
