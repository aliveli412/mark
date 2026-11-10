"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitRsvpAction, type RsvpState } from "@/app/calendar/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send RSVP"}
    </button>
  );
}

export function RsvpForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(submitRsvpAction, null as RsvpState);

  if (state?.ok) {
    return (
      <div className="ev-rsvp-done" role="status">
        <strong>Thank you.</strong>
        <p>Your RSVP has been recorded. We look forward to seeing you.</p>
      </div>
    );
  }

  return (
    <form className="ev-rsvp-form" action={formAction}>
      <input type="hidden" name="event_id" value={eventId} />
      <label>
        Name
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Guests
        <input name="guests" type="number" min={1} max={20} defaultValue={1} required />
      </label>
      <label>
        Note <span className="optional">(optional)</span>
        <textarea name="note" rows={3} placeholder="Dietary needs, late arrival…" />
      </label>
      {state?.error ? <p className="error">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
