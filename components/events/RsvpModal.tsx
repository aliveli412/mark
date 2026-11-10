"use client";

import { useEffect, useId, useRef, useState } from "react";
import { RsvpForm } from "@/components/events/RsvpForm";

export function RsvpModal({
  eventId,
  eventTitle,
  startsLabel,
  triggerClassName = "ev-link accent",
  triggerLabel = "RSVP",
  autoOpen = false,
}: {
  eventId: string;
  eventTitle: string;
  startsLabel?: string;
  triggerClassName?: string;
  triggerLabel?: string;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
      {open ? (
        <div className="ev-modal" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="ev-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ev-modal-head">
              <div>
                <p className="ev-modal-kicker">RSVP</p>
                <h2 id={titleId}>{eventTitle}</h2>
                {startsLabel ? <p className="ev-modal-sub">{startsLabel}</p> : null}
              </div>
              <button ref={closeRef} type="button" className="ev-modal-close" aria-label="Close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <RsvpForm eventId={eventId} />
          </div>
        </div>
      ) : null}
    </>
  );
}
