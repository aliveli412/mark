"use server";

import { revalidatePath } from "next/cache";
import { mockStore } from "@/lib/data/mock-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type RsvpState = { error?: string; ok?: boolean } | null;

export async function submitRsvpAction(
  _prev: RsvpState,
  formData: FormData,
): Promise<RsvpState> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const guests = Number(formData.get("guests") ?? 1);
  const note = String(formData.get("note") ?? "").trim();

  if (!eventId || !name || !email) return { error: "Name and email are required." };
  if (!Number.isFinite(guests) || guests < 1 || guests > 20) {
    return { error: "Guests must be between 1 and 20." };
  }

  if (!getSupabaseEnv().configured) {
    const event = mockStore.getEvent(eventId);
    if (!event?.published || !event.rsvp_enabled) {
      return { error: "RSVP is not open for this event." };
    }
    mockStore.addRsvp({ event_id: eventId, name, email, guests, note });
    revalidatePath(`/calendar/${event.slug || event.id}`);
    return { ok: true };
  }

  const reader = createSupabaseAdminClient() ?? (await createSupabaseServerClient());
  if (!reader) return { error: "Supabase is not configured." };

  const { data: event, error: eventError } = await reader
    .from("events")
    .select("id, slug, published, rsvp_enabled")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) return { error: eventError.message };
  if (!event?.published || !event.rsvp_enabled) {
    return { error: "RSVP is not open for this event." };
  }

  // Public insert via anon client so RLS insert policy applies; fall back to service role after checks.
  const publicClient = (await createSupabaseServerClient()) ?? reader;
  const { error } = await publicClient.from("event_rsvps").insert({
    event_id: eventId,
    name,
    email,
    guests,
    note,
  });

  if (error) {
    // If migration not applied yet, try service role after validation above.
    const admin = createSupabaseAdminClient();
    if (!admin) return { error: error.message };
    const retry = await admin.from("event_rsvps").insert({
      event_id: eventId,
      name,
      email,
      guests,
      note,
    });
    if (retry.error) {
      return {
        error: `${retry.error.message}. If the table is missing, run supabase/events-rsvp.sql.`,
      };
    }
  }

  revalidatePath("/calendar");
  revalidatePath(`/calendar/${event.slug || event.id}`);
  return { ok: true };
}
