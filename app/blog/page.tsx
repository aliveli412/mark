import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/PageBanner";
import { formatPostDate, paragraphs, posts } from "@/lib/posts";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <>
      <PageBanner title="Blog" current="Blog Post" />
      <div className="wrap page">
        <p className="lede">
          Mark Grand Lodge Communication. These are the three addresses published in that category.
        </p>
        <div className="post-list">
          {posts.map((post) => (
            <article className="post-card" key={post.slug}>
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <h2>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{paragraphs(post.body)[0]}</p>
              <Link href={`/blog/${post.slug}`}>Continue reading</Link>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
