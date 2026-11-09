import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/EventForm";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminEvent } from "@/lib/data/catalog";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const event = await getAdminEvent(id);
  if (!event) notFound();
  return (
    <AdminShell title="Edit event" email={session.user.email}>
      <EventForm event={event} />
    </AdminShell>
  );
}
