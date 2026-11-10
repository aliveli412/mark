import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/PageBanner";
import { EventDateBlock } from "@/components/events/EventDateBlock";
import { RsvpForm } from "@/components/events/RsvpForm";
import { getPublishedEvent, listUpcomingEvents } from "@/lib/data/catalog";
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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  return (
    <>
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
              <section className="ev-rsvp" id="rsvp">
                <h2>RSVP</h2>
                <p>Let the lodge know you are coming · starts {parts.time}.</p>
                <RsvpForm eventId={event.id} />
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
          </aside>
        </div>
      </div>
    </>
  );
}
