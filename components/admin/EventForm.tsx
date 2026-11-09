import { saveEventAction } from "@/app/admin/actions";
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
    <form className="admin-form admin-card" action={saveEventAction}>
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <label>
        Title
        <input name="title" required defaultValue={event?.title ?? ""} />
      </label>
      <label>
        Summary
        <input name="summary" defaultValue={event?.summary ?? ""} />
      </label>
      <label>
        Location
        <input name="location" defaultValue={event?.location ?? ""} />
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
      <button type="submit">Save event</button>
    </form>
  );
}
