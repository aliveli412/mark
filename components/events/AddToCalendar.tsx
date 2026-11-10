"use client";

import { useEffect, useId, useRef, useState } from "react";
import { googleCalendarUrl, outlookCalendarUrl } from "@/lib/calendar-links";
import type { EventRecord } from "@/lib/types";

export function AddToCalendar({
  event,
  pageUrl,
  icsHref,
  compact = false,
}: {
  event: EventRecord;
  pageUrl?: string;
  icsHref: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`ev-cal ${compact ? "compact" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="ev-link"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        Add to calendar
      </button>
      {open ? (
        <div className="ev-cal-menu" id={menuId} role="menu">
          <a role="menuitem" href={googleCalendarUrl(event, pageUrl)} target="_blank" rel="noreferrer">
            Google Calendar
          </a>
          <a role="menuitem" href={outlookCalendarUrl(event, pageUrl)} target="_blank" rel="noreferrer">
            Outlook
          </a>
          <a role="menuitem" href={icsHref} download={`${event.slug || event.id}.ics`}>
            Apple / iCal (.ics)
          </a>
        </div>
      ) : null}
    </div>
  );
}
