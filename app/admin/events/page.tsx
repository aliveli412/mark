import Link from "next/link";
import { deleteEventAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminGate } from "@/lib/admin/gate";
import { listAdminEvents } from "@/lib/data/catalog";
import { eventHref, formatEventWhen } from "@/lib/format";

export default async function AdminEventsPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  const events = await listAdminEvents();

  return (
    <AdminShell title="Events" email={gate.session.user.email}>
      <div className="admin-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/admin/events/new">Add event</Link>
        <Link className="button secondary" href="/calendar">View calendar</Link>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>When</th>
              <th>Location</th>
              <th>RSVP</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>
                  <strong>{event.title}</strong>
                  <div>{event.category || event.slug}</div>
                </td>
                <td>{formatEventWhen(event.starts_at, event.ends_at)}</td>
                <td>{event.location || "—"}</td>
                <td>{event.rsvp_enabled ? "Open" : "Closed"}</td>
                <td>
                  <span className={`pill ${event.published ? "ok" : "draft"}`}>
                    {event.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    <Link className="button secondary" href={`/admin/events/${event.id}`}>Edit</Link>
                    {event.published ? (
                      <Link className="button secondary" href={eventHref(event)}>View</Link>
                    ) : null}
                    <form action={deleteEventAction}>
                      <input type="hidden" name="id" value={event.id} />
                      <button className="danger" type="submit">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
