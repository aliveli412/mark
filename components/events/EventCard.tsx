"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToCalendar } from "@/components/events/AddToCalendar";
import { EventDateBlock } from "@/components/events/EventDateBlock";
import { RsvpModal } from "@/components/events/RsvpModal";
import { mapsDirectionsUrl } from "@/lib/calendar-links";
import { eventDateParts, eventHref, formatEventWhen } from "@/lib/format";
import type { EventRecord } from "@/lib/types";

export function EventCard({
  event,
  expanded: expandedProp,
}: {
  event: EventRecord;
  expanded?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(expandedProp));
  const parts = eventDateParts(event.starts_at);
  const href = eventHref(event);
  const directions = mapsDirectionsUrl(event);
  const icsHref = `${href}/ics`;

  return (
    <article className={`ev-item ${open ? "is-open" : ""}`}>
      <EventDateBlock startsAt={event.starts_at} />
      <div className="ev-item-body">
        <div className="ev-item-top">
          <div>
            <h3>
              <Link href={href}>{event.title}</Link>
            </h3>
            {event.location ? <p className="ev-at">@ {event.location}</p> : null}
          </div>
          <button
            type="button"
            className="ev-expand"
            aria-expanded={open}
            aria-label={open ? "Collapse event" : "Expand event"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "−" : "+"}
          </button>
        </div>
        <p className="ev-meta-line">{formatEventWhen(event.starts_at, event.ends_at)}</p>
        {event.category ? <p className="ev-cat">{event.category}</p> : null}

        {open ? (
          <div className="ev-card-panel">
            {event.summary ? <p className="ev-summary">{event.summary}</p> : null}
            {event.address ? <p className="ev-address">{event.address}</p> : null}
            <div className="ev-item-actions">
              <Link className="ev-link" href={href}>
                View details
              </Link>
              <AddToCalendar event={event} icsHref={icsHref} compact />
              {directions ? (
                <a className="ev-link" href={directions} target="_blank" rel="noreferrer">
                  Get directions
                </a>
              ) : null}
              {event.rsvp_enabled ? (
                <RsvpModal
                  eventId={event.id}
                  eventTitle={event.title}
                  startsLabel={`Starts ${parts.time}`}
                  triggerLabel={`RSVP · ${parts.time}`}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="ev-item-actions">
            <Link className="ev-link" href={href}>
              View event
            </Link>
            {event.rsvp_enabled ? (
              <RsvpModal
                eventId={event.id}
                eventTitle={event.title}
                startsLabel={`Starts ${parts.time}`}
                triggerLabel="RSVP"
              />
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
