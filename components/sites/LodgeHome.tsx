import Link from "next/link";
import { Countdown } from "@/components/sites/Countdown";
import { LodgeEventPanel } from "@/components/sites/LodgeEventPanel";
import type { MarkSite } from "@/lib/mark-sites";

export function LodgeHome({ site }: { site: MarkSite }) {
  return (
    <>
      <Countdown targetIso={site.nextMeetingAt} label={site.nextMeetingLabel} bookingHref={site.bookingHref} />

      <section className="lodge-posts">
        {site.posts.map((post) => (
          <article key={post.title}>
            <h3>{post.title}</h3>
            <p className="lodge-cat">in {post.category}</p>
            <img src={post.image} alt="" />
            <Link href="#event">Continue reading →</Link>
          </article>
        ))}
      </section>

      <LodgeEventPanel site={site} />
    </>
  );
}
