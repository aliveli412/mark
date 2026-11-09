import { AdminShell } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/EventForm";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewEventPage() {
  const session = await requireAdmin();
  return (
    <AdminShell title="New event" email={session.user.email}>
      <EventForm />
    </AdminShell>
  );
}
