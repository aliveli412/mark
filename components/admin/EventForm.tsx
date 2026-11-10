import { saveEventAction } from "@/app/admin/actions";
import { AdminNavForm } from "@/components/admin/AdminNavForm";
import type { EventRecord } from "@/lib/types";

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventForm({ event }: { event?: EventRecord | null }) {
  return (
    <AdminNavForm className="admin-form admin-card" action={saveEventAction}>
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <label>
        Title
        <input name="title" required defaultValue={event?.title ?? ""} />
      </label>
      <label>
        Slug
        <input name="slug" defaultValue={event?.slug ?? ""} placeholder="auto from title if blank" />
      </label>
      <label>
        Category
        <input name="category" defaultValue={event?.category ?? ""} placeholder="e.g. Gallipoli MMM Meetings" />
      </label>
      <label>
        Summary
        <input name="summary" defaultValue={event?.summary ?? ""} />
      </label>
      <label>
        Location name
        <input name="location" defaultValue={event?.location ?? ""} placeholder="Mark Mason Hall" />
      </label>
      <label>
        Address
        <input name="address" defaultValue={event?.address ?? ""} placeholder="Full street address" />
      </label>
      <label>
        Contact name
        <input name="contact_name" defaultValue={event?.contact_name ?? ""} />
      </label>
      <label>
        Contact phone
        <input name="contact_phone" defaultValue={event?.contact_phone ?? ""} />
      </label>
      <label>
        Contact email
        <input name="contact_email" type="email" defaultValue={event?.contact_email ?? ""} />
      </label>
      <label>
        Starts
        <input name="starts_at" type="datetime-local" required defaultValue={toLocalInput(event?.starts_at)} />
      </label>
      <label>
        Ends
        <input name="ends_at" type="datetime-local" defaultValue={toLocalInput(event?.ends_at)} />
      </label>
      <label>
        Body
        <textarea name="body" rows={8} defaultValue={event?.body ?? ""} />
      </label>
      <label className="check">
        <input name="published" type="checkbox" defaultChecked={event?.published ?? true} />
        Published
      </label>
      <label className="check">
        <input name="rsvp_enabled" type="checkbox" defaultChecked={event?.rsvp_enabled ?? true} />
        RSVP open
      </label>
      <button type="submit">Save event</button>
    </AdminNavForm>
  );
}
