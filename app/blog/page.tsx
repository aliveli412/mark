import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/PageBanner";
import { listPublishedPosts, usingSampleData } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage() {
  const posts = await listPublishedPosts();
  return (
    <>
      <PageBanner title="News" current="Blog" />
      <div className="wrap page">
        <p className="lede">
          Portal news and communications
          {usingSampleData() ? " (sample data until Supabase is connected)" : ""}.
        </p>
        <div className="post-list">
          {posts.map((post) => (
            <article className="post-card" key={post.id}>
              {post.published_at ? (
                <time dateTime={post.published_at}>
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "Europe/London",
                  }).format(new Date(post.published_at))}
                </time>
              ) : null}
              <h2>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`}>Continue reading</Link>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
