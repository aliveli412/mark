import { AdminShell } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/EventForm";
import { adminGate } from "@/lib/admin/gate";

export default async function NewEventPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  return (
    <AdminShell title="New event" email={gate.session.user.email}>
      <EventForm />
    </AdminShell>
  );
}
