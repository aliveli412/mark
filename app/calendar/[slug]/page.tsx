import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { PageBanner } from "@/components/PageBanner";
import { EventActions } from "@/components/events/EventActions";
import { EventDateBlock } from "@/components/events/EventDateBlock";
import { RsvpModal } from "@/components/events/RsvpModal";
import { getPublishedEvent, listUpcomingEvents } from "@/lib/data/catalog";
import { eventLocationLine } from "@/lib/calendar-links";
import { eventDateParts, eventHref, formatEventWhen, paragraphs } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rsvp?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const event = await getPublishedEvent(slug);

  if (!event) {
    return (
      <>
        <PageBanner title="Event not found" />
        <div className="wrap page">
          <p>That meeting is not published or the link is wrong.</p>
          <Link href="/calendar">Back to calendar</Link>
        </div>
      </>
    );
  }

  const upcoming = await listUpcomingEvents(5, event.id);
  const parts = eventDateParts(event.starts_at);
  const body = paragraphs(event.body || event.summary);
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const pageUrl = `${proto}://${host}${eventHref(event)}`;
  const locationLine = eventLocationLine(event);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary || event.body,
    startDate: event.starts_at,
    endDate: event.ends_at || event.starts_at,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: locationLine
      ? {
          "@type": "Place",
          name: event.location || "Venue",
          address: event.address || event.location,
        }
      : undefined,
    organizer: event.contact_name
      ? {
          "@type": "Organization",
          name: event.contact_name,
          email: event.contact_email || undefined,
          telephone: event.contact_phone || undefined,
        }
      : undefined,
    url: pageUrl,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageBanner title={event.title} current="Calendar" />
      <div className="wrap page ev-single">
        <div className="ev-single-grid">
          <article className="ev-detail">
            <div className="ev-detail-head">
              <EventDateBlock startsAt={event.starts_at} />
              <div>
                {event.category ? <p className="ev-cat">{event.category}</p> : null}
                <h1>{event.title}</h1>
                <p className="ev-meta-line">{formatEventWhen(event.starts_at, event.ends_at)}</p>
              </div>
            </div>

            <EventActions event={event} pageUrl={pageUrl} />

            <dl className="ev-facts">
              <div>
                <dt>When</dt>
                <dd>{formatEventWhen(event.starts_at, event.ends_at)}</dd>
              </div>
              {event.location || event.address ? (
                <div>
                  <dt>Where</dt>
                  <dd>
                    {event.location || "Venue TBC"}
                    {event.address ? (
                      <>
                        <br />
                        <span className="ev-address">{event.address}</span>
                      </>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              {event.contact_name || event.contact_phone || event.contact_email ? (
                <div>
                  <dt>Contact</dt>
                  <dd>
                    {event.contact_name ? <div>{event.contact_name}</div> : null}
                    {event.contact_phone ? <div>{event.contact_phone}</div> : null}
                    {event.contact_email ? (
                      <div>
                        <a href={`mailto:${event.contact_email}`}>{event.contact_email}</a>
                      </div>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>

            {body.length ? (
              <div className="ev-body">
                {body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            {event.rsvp_enabled ? (
              <section className="ev-rsvp-cta" id="rsvp">
                <div>
                  <h2>Will you attend?</h2>
                  <p>Open the RSVP popup to reserve your place · starts {parts.time}.</p>
                </div>
                <RsvpModal
                  eventId={event.id}
                  eventTitle={event.title}
                  startsLabel={`Starts ${parts.time}`}
                  triggerLabel="Open RSVP"
                  autoOpen={query.rsvp === "1"}
                />
              </section>
            ) : null}
          </article>

          <aside className="ev-side">
            <h2>Upcoming events</h2>
            <div className="ev-side-list">
              {upcoming.length === 0 ? (
                <p className="ev-side-empty">No other upcoming meetings.</p>
              ) : (
                upcoming.map((item) => {
                  const itemParts = eventDateParts(item.starts_at);
                  return (
                    <Link className="ev-side-item" key={item.id} href={eventHref(item)}>
                      <EventDateBlock startsAt={item.starts_at} />
                      <div>
                        <strong>{item.title}</strong>
                        <span>{itemParts.time}</span>
                        {item.location ? <span>@ {item.location}</span> : null}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            <Link className="ev-side-all" href="/calendar">
              View calendar →
            </Link>
            <a className="ev-side-all" href="/calendar/feed.ics">
              Subscribe to all (.ics)
            </a>
          </aside>
        </div>
      </div>
    </>
  );
}
