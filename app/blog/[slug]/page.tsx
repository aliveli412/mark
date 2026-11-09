import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBanner } from "@/components/PageBanner";
import { formatPostDate, paragraphs, posts } from "@/lib/posts";

type Params = { slug: string };

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  return { title: post?.title ?? "Blog" };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();

  return (
    <>
      <PageBanner title={post.title} current="Blog" />
      <div className="wrap page">
        <article className="prose">
          <p>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          </p>
          {paragraphs(post.body).map((paragraph) => (
            <p key={paragraph.slice(0, 80)}>{paragraph}</p>
          ))}
          <p>
            <Link href="/blog">Back to the blog</Link>
          </p>
        </article>
      </div>
    </>
  );
}
