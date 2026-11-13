"use client";

import { AddToCalendar } from "@/components/events/AddToCalendar";
import { RsvpModal } from "@/components/events/RsvpModal";
import { mapsDirectionsUrl } from "@/lib/calendar-links";
import { eventDateParts, eventHref } from "@/lib/format";
import type { EventRecord } from "@/lib/types";

export function EventActions({
  event,
  pageUrl,
}: {
  event: EventRecord;
  pageUrl: string;
}) {
  const parts = eventDateParts(event.starts_at);
  const directions = mapsDirectionsUrl(event);
  const icsHref = `${eventHref(event)}/ics`;

  return (
    <div className="ev-actions-bar">
      <AddToCalendar event={event} pageUrl={pageUrl} icsHref={icsHref} />
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
          triggerLabel="RSVP"
        />
      ) : null}
    </div>
  );
}
