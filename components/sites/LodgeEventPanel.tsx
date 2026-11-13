import { googleCalendarUrl } from "@/lib/calendar-links";
import type { LodgeMeetingListItem } from "@/lib/lodge-meetings";
import type { LodgeEvent, MarkSite } from "@/lib/mark-sites";
import { lodgePath } from "@/lib/mark-sites";

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const day = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(start);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Europe/London",
  });
  return `${day} · ${time.format(start)} – ${time.format(end)} (Europe/London)`;
}

export function LodgeEventPanel({
  site,
  event,
  bookingHref,
  upcoming = [],
}: {
  site: MarkSite;
  event: LodgeEvent;
  bookingHref: string;
  upcoming?: LodgeMeetingListItem[];
}) {
  const pseudoEvent = {
    id: `${site.slug}-next`,
    lodge_id: null,
    lodge_slug: site.slug,
    slug: `${site.slug}-next-meeting`,
    title: event.title,
    summary: event.subtitle || event.title,
    body: event.attendanceNote,
    location: event.location,
    address: site.addressLines.join(", "),
    contact_name: site.fullName,
    contact_phone: site.phone,
    contact_email: "",
    category: "Meetings",
    starts_at: event.startsAt,
    ends_at: event.endsAt,
    published: true,
    rsvp_enabled: !event.rsvpClosed,
  };
  const icsHref = `/calendar/feed.ics`;
  const googleHref = googleCalendarUrl(pseudoEvent, lodgePath(site.slug));
  const later = upcoming.slice(1);

  return (
    <section className="lodge-home-featured" id="event">
      <div className="lodge-home-featured-main">
        <p className="lodge-home-kicker">Featured meeting</p>
        <div className="lodge-home-featured-date">{event.dateLabel}</div>
        <h2>{event.title}</h2>
        {event.subtitle ? <p className="lodge-home-featured-sub">{event.subtitle}</p> : null}

        <dl className="lodge-home-featured-meta">
          <div>
            <dt>When</dt>
            <dd>{formatRange(event.startsAt, event.endsAt)}</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>{event.location}</dd>
          </div>
          <div>
            <dt>Organizer</dt>
            <dd>{site.fullName}</dd>
          </div>
          <div>
            <dt>Attendance</dt>
            <dd>{event.attendanceNote}</dd>
          </div>
        </dl>

        <div className="lodge-home-featured-actions">
          <a className="lodge-home-cta" href={bookingHref}>
            {event.rsvpClosed ? "View details" : "RSVP & booking"}
          </a>
          <a className="lodge-home-cta-ghost" href={lodgePath(site.slug, "meetings", "regular-meetings")}>
            All meetings
          </a>
          <a className="lodge-home-cal" href={icsHref}>
            Calendar
          </a>
          <a className="lodge-home-cal" href={googleHref} target="_blank" rel="noreferrer">
            GoogleCal
          </a>
        </div>
      </div>

      {later.length ? (
        <aside className="lodge-home-upcoming" aria-label="Upcoming meetings">
          <h3>Coming up</h3>
          <ol>
            {later.map((item) => (
              <li key={item.id}>
                <a href={item.href}>
                  <span className="lodge-home-upcoming-when">
                    {new Date(item.startsAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      timeZone: "Europe/London",
                    })}
                  </span>
                  <span className="lodge-home-upcoming-title">{item.title}</span>
                  <span className="lodge-home-upcoming-place">{item.location}</span>
                </a>
              </li>
            ))}
          </ol>
        </aside>
      ) : null}
    </section>
  );
}
