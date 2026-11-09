import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBanner } from "@/components/PageBanner";
import { getPublishedPost, listPublishedPosts } from "@/lib/data/catalog";
import { paragraphs } from "@/lib/format";

type Params = { slug: string };

export async function generateStaticParams() {
  const posts = await listPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  return { title: post?.title ?? "News" };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  return (
    <>
      <PageBanner title={post.title} current="Blog" />
      <div className="wrap page">
        <article className="prose">
          {post.published_at ? (
            <p>
              <time dateTime={post.published_at}>
                {new Intl.DateTimeFormat("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Europe/London",
                }).format(new Date(post.published_at))}
              </time>
            </p>
          ) : null}
          {paragraphs(post.body).map((paragraph) => (
            <p key={paragraph.slice(0, 80)}>{paragraph}</p>
          ))}
          <p>
            <Link href="/blog">Back to news</Link>
          </p>
        </article>
      </div>
    </>
  );
}
