"use client";

import { useEffect } from "react";

export function CalendarToolbar({
  rangeLabel,
  feedHref,
}: {
  rangeLabel: string;
  feedHref: string;
}) {
  useEffect(() => {
    // no-op mount for future client filters
  }, []);

  function setExpanded(open: boolean) {
    document.querySelectorAll<HTMLButtonElement>(".ev-expand").forEach((button) => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      if (expanded !== open) button.click();
    });
  }

  return (
    <div className="ev-toolbar">
      <div className="ev-toolbar-main">
        <p className="lede ev-lede">Meetings and lodge events in agenda view.</p>
        <div className="ev-toolbar-actions">
          <button type="button" className="ev-tool-btn" onClick={() => setExpanded(true)}>
            Expand all
          </button>
          <button type="button" className="ev-tool-btn" onClick={() => setExpanded(false)}>
            Collapse all
          </button>
          <button type="button" className="ev-tool-btn" onClick={() => window.print()}>
            Print
          </button>
          <a className="ev-tool-btn" href={feedHref}>
            Subscribe (.ics)
          </a>
        </div>
      </div>
      <div className="ev-range" aria-label="Shown date range">
        {rangeLabel}
      </div>
    </div>
  );
}
