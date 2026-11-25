import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/PageBanner";
import { formatNewsDate, listNewsPosts, newsDisplayDate, type NewsPost } from "@/lib/news-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News" };

function PostMeta({ post }: { post: NewsPost }) {
  const category = post.primary_category?.name;
  const displayAt = newsDisplayDate(post);
  const date = formatNewsDate(displayAt);
  return (
    <div className="news-meta">
      {category ? <span className="news-tag">{category}</span> : null}
      {date ? <time dateTime={displayAt ?? undefined}>{date}</time> : null}
    </div>
  );
}

function heroOrder(posts: NewsPost[]) {
  const score = (post: NewsPost) => {
    const names = post.categories.map((c) => c.slug);
    if (names.includes("mbf") || names.includes("charities") || names.includes("brethren")) return 2;
    if (names.includes("uncategorized") || names.includes("uncategorised")) return 0;
    return 1;
  };
  return posts
    .slice()
    .sort((a, b) => score(b) - score(a) || (b.published_at || "").localeCompare(a.published_at || ""));
}

export default function NewsPage() {
  const posts = heroOrder(listNewsPosts());
  const [featured, ...rest] = posts;
  const side = rest.slice(0, 3);
  const remaining = rest.slice(3);

  return (
    <>
      <PageBanner title="News" current="News" />
      <div className="wrap page news-page">
        <p className="lede">General news for the Order of Mark Master Masons.</p>

        {featured ? (
          <section className="news-hero" aria-label="Featured news">
            <Link href={`/news/${featured.slug}`} className="news-hero-main">
              {featured.image ? (
                <img src={featured.image} alt="" />
              ) : (
                <div className="news-hero-fallback" />
              )}
              <div className="news-hero-copy">
                <PostMeta post={featured} />
                <h2>{featured.title}</h2>
                <p>{featured.excerpt}</p>
              </div>
            </Link>
            {side.length ? (
              <div className="news-hero-side">
                {side.map((post) => (
                  <Link href={`/news/${post.slug}`} className="news-hero-tile" key={post.id}>
                    {post.image ? <img src={post.image} alt="" /> : <div className="news-hero-fallback" />}
                    <div className="news-hero-copy">
                      <PostMeta post={post} />
                      <h3>{post.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <p>No published news articles yet.</p>
        )}

        {remaining.length ? (
          <section className="news-grid-section" aria-label="More news">
            <h2 className="news-section-title">More articles</h2>
            <div className="news-grid">
              {remaining.map((post) => (
                <article className="news-card" key={post.id}>
                  <Link href={`/news/${post.slug}`} className="news-card-media">
                    {post.image ? <img src={post.image} alt="" /> : <div className="news-hero-fallback" />}
                  </Link>
                  <div className="news-card-body">
                    <PostMeta post={post} />
                    <h3>
                      <Link href={`/news/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p>{post.excerpt}</p>
                    <Link className="news-read-more" href={`/news/${post.slug}`}>
                      Read more
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
