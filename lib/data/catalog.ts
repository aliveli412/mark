import { mockStore } from "@/lib/data/mock-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { EventRecord, PostRecord, ProductRecord } from "@/lib/types";

export function usingSampleData() {
  return !getSupabaseEnv().configured;
}

function asEvent(row: Record<string, unknown> | EventRecord): EventRecord {
  const event = row as Partial<EventRecord> & { id: string; title: string; starts_at: string };
  return {
    id: event.id,
    lodge_id: event.lodge_id ?? null,
    lodge_slug: event.lodge_slug ?? null,
    slug: event.slug || event.id,
    title: event.title,
    summary: event.summary ?? "",
    body: event.body ?? "",
    location: event.location ?? "",
    address: event.address ?? "",
    contact_name: event.contact_name ?? "",
    contact_phone: event.contact_phone ?? "",
    contact_email: event.contact_email ?? "",
    category: event.category ?? "",
    starts_at: event.starts_at,
    ends_at: event.ends_at ?? null,
    published: Boolean(event.published),
    rsvp_enabled: event.rsvp_enabled ?? false,
  };
}

async function publicClient() {
  try {
    return await createSupabaseServerClient();
  } catch {
    return null;
  }
}

function adminClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function listPublishedEvents(): Promise<EventRecord[]> {
  const supabase = await publicClient();
  if (!supabase) return mockStore.listEvents(false);
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("published", true)
      .order("starts_at", { ascending: true });
    if (error) return mockStore.listEvents(false);
    return (data ?? []).map((row) => asEvent(row as EventRecord));
  } catch {
    return mockStore.listEvents(false);
  }
}

export async function listAdminEvents(): Promise<EventRecord[]> {
  const supabase = adminClient() ?? (await publicClient());
  if (!supabase) return mockStore.listEvents(true);
  try {
    const { data, error } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
    if (error) return mockStore.listEvents(true);
    return (data ?? []).map((row) => asEvent(row as EventRecord));
  } catch {
    return mockStore.listEvents(true);
  }
}

export async function getAdminEvent(id: string) {
  const supabase = adminClient() ?? (await publicClient());
  if (!supabase) return mockStore.getEvent(id);
  try {
    const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
    if (error) return mockStore.getEvent(id);
    return data ? asEvent(data as EventRecord) : null;
  } catch {
    return mockStore.getEvent(id);
  }
}

export async function getPublishedEvent(slugOrId: string) {
  const supabase = await publicClient();
  if (!supabase) {
    const event = mockStore.getEventBySlug(slugOrId);
    return event?.published ? event : null;
  }
  try {
    const bySlug = await supabase
      .from("events")
      .select("*")
      .eq("slug", slugOrId)
      .eq("published", true)
      .maybeSingle();
    if (!bySlug.error && bySlug.data) return asEvent(bySlug.data as EventRecord);

    const byId = await supabase
      .from("events")
      .select("*")
      .eq("id", slugOrId)
      .eq("published", true)
      .maybeSingle();
    if (byId.error) {
      const event = mockStore.getEventBySlug(slugOrId);
      return event?.published ? event : null;
    }
    return byId.data ? asEvent(byId.data as EventRecord) : null;
  } catch {
    const event = mockStore.getEventBySlug(slugOrId);
    return event?.published ? event : null;
  }
}

export async function listUpcomingEvents(limit = 6, excludeId?: string) {
  const events = await listPublishedEvents();
  const now = Date.now();
  return events
    .filter((event) => new Date(event.starts_at).getTime() >= now - 6 * 60 * 60 * 1000)
    .filter((event) => event.id !== excludeId)
    .slice(0, limit);
}

/** Published upcoming meetings for one Mark Site lodge slug (homepage + members list). */
export async function listLodgeUpcomingEvents(lodgeSlug: string, limit = 24): Promise<EventRecord[]> {
  const events = await listPublishedEvents();
  const now = Date.now() - 6 * 60 * 60 * 1000;
  return events
    .filter((event) => event.lodge_slug === lodgeSlug)
    .filter((event) => new Date(event.starts_at).getTime() >= now)
    .slice(0, limit);
}

export async function listEventRsvps(eventId: string) {
  const supabase = adminClient();
  if (!supabase) return mockStore.listRsvps(eventId);
  try {
    const { data, error } = await supabase
      .from("event_rsvps")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (error) return mockStore.listRsvps(eventId);
    return data ?? [];
  } catch {
    return mockStore.listRsvps(eventId);
  }
}

export async function listPublishedPosts(): Promise<PostRecord[]> {
  const supabase = await publicClient();
  if (!supabase) return mockStore.listPosts(false);
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error) return mockStore.listPosts(false);
    return (data ?? []) as PostRecord[];
  } catch {
    return mockStore.listPosts(false);
  }
}

export async function listAdminPosts(): Promise<PostRecord[]> {
  const supabase = adminClient() ?? (await publicClient());
  if (!supabase) return mockStore.listPosts(true);
  try {
    const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (error) return mockStore.listPosts(true);
    return (data ?? []) as PostRecord[];
  } catch {
    return mockStore.listPosts(true);
  }
}

export async function getPublishedPost(slug: string) {
  const supabase = await publicClient();
  if (!supabase) {
    const post = mockStore.getPostBySlug(slug);
    return post?.published ? post : null;
  }
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) {
      const post = mockStore.getPostBySlug(slug);
      return post?.published ? post : null;
    }
    return data as PostRecord | null;
  } catch {
    const post = mockStore.getPostBySlug(slug);
    return post?.published ? post : null;
  }
}

export async function getAdminPost(id: string) {
  const supabase = adminClient() ?? (await publicClient());
  if (!supabase) return mockStore.getPost(id);
  try {
    const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
    if (error) return mockStore.getPost(id);
    return data as PostRecord | null;
  } catch {
    return mockStore.getPost(id);
  }
}

export async function listActiveProducts(): Promise<ProductRecord[]> {
  const supabase = await publicClient();
  if (!supabase) return mockStore.listProducts(false);
  try {
    const { data, error } = await supabase.from("products").select("*").eq("active", true).order("name");
    if (error) return mockStore.listProducts(false);
    return (data ?? []) as ProductRecord[];
  } catch {
    return mockStore.listProducts(false);
  }
}

export async function listAdminProducts(): Promise<ProductRecord[]> {
  const supabase = adminClient() ?? (await publicClient());
  if (!supabase) return mockStore.listProducts(true);
  try {
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) return mockStore.listProducts(true);
    return (data ?? []) as ProductRecord[];
  } catch {
    return mockStore.listProducts(true);
  }
}

export async function getAdminProduct(id: string) {
  const supabase = adminClient() ?? (await publicClient());
  if (!supabase) return mockStore.getProduct(id);
  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error) return mockStore.getProduct(id);
    return data as ProductRecord | null;
  } catch {
    return mockStore.getProduct(id);
  }
}
