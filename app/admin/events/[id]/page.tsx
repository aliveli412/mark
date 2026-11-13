import { AdminShell } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/EventForm";
import { adminGate } from "@/lib/admin/gate";
import { getAdminEvent } from "@/lib/data/catalog";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  const { id } = await params;
  const event = await getAdminEvent(id);
  if (!event) {
    return (
      <AdminShell title="Event not found" email={gate.session.user.email}>
        <p>No event with that id.</p>
      </AdminShell>
    );
  }
  return (
    <AdminShell title="Edit event" email={gate.session.user.email}>
      <EventForm event={event} />
    </AdminShell>
  );
}
