import Link from "next/link";
import { Countdown } from "@/components/sites/Countdown";
import { LodgeEventPanel } from "@/components/sites/LodgeEventPanel";
import type { LodgeMeetingListItem } from "@/lib/lodge-meetings";
import type { LodgeEvent, MarkSite } from "@/lib/mark-sites";
import { lodgePath } from "@/lib/mark-sites";

export function LodgeHome({
  site,
  meeting,
}: {
  site: MarkSite;
  meeting: {
    label: string;
    targetIso: string;
    bookingHref: string;
    featured: LodgeEvent;
    list: LodgeMeetingListItem[];
  };
}) {
  return (
    <article className="lodge-home">
      {site.sourceNote ? <p className="lodge-source-note">{site.sourceNote}</p> : null}

      <section className="lodge-home-hero" aria-labelledby="lodge-home-hero-title">
        <div className="lodge-home-hero-glow" aria-hidden="true" />
        <p className="lodge-home-kicker lodge-home-kicker-light">{site.brand}</p>
        <h2 id="lodge-home-hero-title">{meeting.label}</h2>
        <p className="lodge-home-hero-lead">
          Next: <strong>{meeting.featured.title}</strong>
          {meeting.featured.location ? ` · ${meeting.featured.location}` : null}
        </p>
        <Countdown
          targetIso={meeting.targetIso}
          label=""
          bookingHref={meeting.bookingHref}
          showBookingLink={false}
        />
        <a className="lodge-home-cta lodge-home-cta-on-dark" href={meeting.bookingHref}>
          Attendance &amp; booking
        </a>
      </section>

      <LodgeEventPanel
        site={site}
        event={meeting.featured}
        bookingHref={meeting.bookingHref}
        upcoming={meeting.list}
      />

      {site.posts.length ? (
        <section className="lodge-posts" aria-label="Latest from the lodge">
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
    </article>
  );
}
