import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";
import { CalendarToolbar } from "@/components/events/CalendarToolbar";
import { EventCard } from "@/components/events/EventCard";
import { listPublishedEvents, usingSampleData } from "@/lib/data/catalog";
import { groupEventsByMonth } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const events = await listPublishedEvents();
  const months = groupEventsByMonth(events);
  const rangeLabel =
    events.length === 0
      ? "No dates"
      : `${new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "Europe/London" }).format(new Date(events[0].starts_at))} – ${new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "Europe/London" }).format(new Date(events[events.length - 1].starts_at))}`.toUpperCase();

  return (
    <>
      <PageBanner title="Calendar" />
      <div className="wrap page ev-page">
        <CalendarToolbar rangeLabel={rangeLabel} feedHref="/calendar/feed.ics" />
        {usingSampleData() ? (
          <p className="ev-sample-note">Showing sample events until Supabase is connected.</p>
        ) : null}

        {months.length === 0 ? (
          <div className="empty">
            <h2>No meetings published yet</h2>
            <p>Add events from Admin → Events.</p>
          </div>
        ) : (
          <div className="ev-agenda">
            {months.map(([month, items]) => (
              <section key={month} className="ev-month">
                <header className="ev-month-head">
                  <h2>{month}</h2>
                  <span>
                    {items.length} event{items.length === 1 ? "" : "s"}
                  </span>
                </header>
                <div className="ev-list">
                  {items.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
