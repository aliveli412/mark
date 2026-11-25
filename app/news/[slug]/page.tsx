import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBanner } from "@/components/PageBanner";
import {
  formatNewsDate,
  getNewsPost,
  listNewsPosts,
  localizeNewsHtml,
  newsDisplayDate,
} from "@/lib/news-content";

type Params = { slug: string };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return listNewsPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getNewsPost(slug);
  return { title: post?.title ?? "News" };
}

export default async function NewsArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getNewsPost(slug);
  if (!post) notFound();

  const posts = listNewsPosts();
  const publishedAt = newsDisplayDate(post);
  const category = post.primary_category?.name;
  const date = formatNewsDate(publishedAt);
  const related = posts.filter((item) => item.slug !== slug).slice(0, 4);
  const html = localizeNewsHtml(post.html || "", posts)
    .replace(/<\/?(?:html|body)[^>]*>/gi, "")
    .trim();

  return (
    <>
      <PageBanner title={post.title} current="News" />
      <div className="wrap page news-article-page">
        <article className="news-article">
          <header className="news-article-header">
            <div className="news-meta">
              {category ? <span className="news-tag">{category}</span> : null}
              {date ? <time dateTime={publishedAt ?? undefined}>{date}</time> : null}
            </div>
            <h1>{post.title}</h1>
          </header>
          {post.image ? (
            <figure className="news-article-hero">
              <img src={post.image} alt="" />
            </figure>
          ) : null}
          <div className="news-rich" dangerouslySetInnerHTML={{ __html: html }} />
          <p className="news-back">
            <Link href="/news">← Back to news</Link>
          </p>
        </article>

        {related.length ? (
          <aside className="news-related" aria-label="More news">
            <h2>More news</h2>
            <div className="news-related-list">
              {related.map((item) => (
                <Link href={`/news/${item.slug}`} className="news-related-item" key={item.id}>
                  {item.image ? <img src={item.image} alt="" /> : <div className="news-hero-fallback" />}
                  <div>
                    <strong>{item.title}</strong>
                    <span>{formatNewsDate(newsDisplayDate(item))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </>
  );
}
