import Link from "next/link";
import { Countdown } from "@/components/sites/Countdown";
import { LodgeEventPanel } from "@/components/sites/LodgeEventPanel";
import type { MarkSite } from "@/lib/mark-sites";
import { lodgePath } from "@/lib/mark-sites";

export function LodgeHome({ site }: { site: MarkSite }) {
  return (
    <>
      {site.sourceNote ? <p className="lodge-source-note">{site.sourceNote}</p> : null}
      <Countdown targetIso={site.nextMeetingAt} label={site.nextMeetingLabel} bookingHref={site.bookingHref} />

      {site.posts.length ? (
        <section className="lodge-posts">
          {site.posts.map((post, index) => (
            <article key={`${post.title}-${index}`} id={`post-${index}`}>
              <h3>{post.title}</h3>
              <p className="lodge-cat">in {post.category}</p>
              <img src={post.image} alt="" />
              <Link href={post.href || `${lodgePath(site.slug)}#event`}>Continue reading →</Link>
            </article>
          ))}
        </section>
      ) : null}

      <LodgeEventPanel site={site} />
    </>
  );
}
