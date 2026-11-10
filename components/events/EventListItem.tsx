import Link from "next/link";
import { EventDateBlock } from "@/components/events/EventDateBlock";
import { eventDateParts, eventHref, formatEventWhen } from "@/lib/format";
import type { EventRecord } from "@/lib/types";

export function EventListItem({ event }: { event: EventRecord }) {
  const parts = eventDateParts(event.starts_at);
  const href = eventHref(event);

  return (
    <article className="ev-item">
      <EventDateBlock startsAt={event.starts_at} />
      <div className="ev-item-body">
        <div className="ev-item-top">
          <h3>
            <Link href={href}>{event.title}</Link>
          </h3>
          {event.location ? <p className="ev-at">@ {event.location}</p> : null}
        </div>
        <p className="ev-meta-line">{formatEventWhen(event.starts_at, event.ends_at)}</p>
        {event.category ? <p className="ev-cat">{event.category}</p> : null}
        {event.summary ? <p className="ev-summary">{event.summary}</p> : null}
        <div className="ev-item-actions">
          <Link className="ev-link" href={href}>
            View event
          </Link>
          {event.rsvp_enabled ? (
            <Link className="ev-link accent" href={`${href}#rsvp`}>
              RSVP · {parts.time}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
