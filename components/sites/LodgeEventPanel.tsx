import { googleCalendarUrl } from "@/lib/calendar-links";
import type { MarkSite } from "@/lib/mark-sites";
import { lodgePath } from "@/lib/mark-sites";

function formatRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const day = new Intl.DateTimeFormat("en-GB", {
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
  return `${day} ${time.format(start)} - ${time.format(end)} (Europe/London)`;
}

export function LodgeEventPanel({ site }: { site: MarkSite }) {
  const event = site.event;
  const pseudoEvent = {
    id: `${site.slug}-next`,
    lodge_id: null,
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

  return (
    <section className="lodge-event" id="event">
      <header className="lodge-event-head">
        <div className="lodge-event-date">{event.dateLabel}</div>
        <div>
          <h2>{event.title}</h2>
          {event.subtitle ? <p>{event.subtitle}</p> : null}
        </div>
      </header>

      <div className="lodge-event-rows">
        <article>
          <h3>Organizer</h3>
          <p>{site.fullName}</p>
          <a className="lodge-pill" href={lodgePath(site.slug, "members", "office-bearers")}>
            Learn more
          </a>
        </article>
        <article>
          <h3>Time</h3>
          <p>{formatRange(event.startsAt, event.endsAt)}</p>
        </article>
        <article>
          <h3>Location</h3>
          <p>{event.location}</p>
          <a className="lodge-pill" href={lodgePath(site.slug, "meetings", "regular-meetings")}>
            Other events
          </a>
        </article>
        <article>
          <h3>Attendance with dining</h3>
          <p>{event.attendanceNote}</p>
        </article>
        <article>
          <h3>RSVP now</h3>
          <p>{event.rsvpClosed ? "RSVPing is closed for this meeting." : "Reserve your place for the meeting and dining."}</p>
          <a className="lodge-pill" href="/contact">
            {event.rsvpClosed ? "Change my RSVP" : "RSVP"}
          </a>
        </article>
        <article>
          <h3>Add to calendar</h3>
          <div className="lodge-cal-links">
            <a href={icsHref}>Calendar</a>
            <a href={googleHref} target="_blank" rel="noreferrer">
              GoogleCal
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
