import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";
import { listPublishedEvents, usingSampleData } from "@/lib/data/catalog";
import { formatEventWhen, groupEventsByMonth } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const events = await listPublishedEvents();
  const months = groupEventsByMonth(events);

  return (
    <>
      <PageBanner title="Calendar" />
      <div className="wrap page">
        <p className="lede">
          Meetings and events{usingSampleData() ? " (sample data until Supabase is connected)" : ""}.
        </p>
        {months.length === 0 ? (
          <div className="empty">
            <h2>No meetings published yet</h2>
            <p>Add events from the admin calendar tools.</p>
          </div>
        ) : (
          <div className="event-months">
            {months.map(([month, items]) => (
              <section key={month} className="event-month">
                <h2>{month}</h2>
                <div className="event-list">
                  {items.map((event) => (
                    <article className="event-card" key={event.id}>
                      <h3>{event.title}</h3>
                      <p className="event-when">{formatEventWhen(event.starts_at, event.ends_at)}</p>
                      {event.location ? <p className="event-location">{event.location}</p> : null}
                      {event.summary ? <p>{event.summary}</p> : null}
                    </article>
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
