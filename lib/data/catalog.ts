import { mockStore } from "@/lib/data/mock-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { EventRecord, PostRecord, ProductRecord } from "@/lib/types";

export function usingSampleData() {
  return !getSupabaseEnv().configured;
}

export async function listPublishedEvents(): Promise<EventRecord[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockStore.listEvents(false);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("published", true)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventRecord[];
}

export async function listAdminEvents(): Promise<EventRecord[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockStore.listEvents(true);
  const { data, error } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventRecord[];
}

export async function getAdminEvent(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockStore.getEvent(id);
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as EventRecord | null;
}

export async function listPublishedPosts(): Promise<PostRecord[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockStore.listPosts(false);
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PostRecord[];
}

export async function listAdminPosts(): Promise<PostRecord[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockStore.listPosts(true);
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PostRecord[];
}

export async function getPublishedPost(slug: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const post = mockStore.getPostBySlug(slug);
    return post?.published ? post : null;
  }
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return data as PostRecord | null;
}

export async function getAdminPost(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockStore.getPost(id);
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as PostRecord | null;
}

export async function listActiveProducts(): Promise<ProductRecord[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockStore.listProducts(false);
  const { data, error } = await supabase.from("products").select("*").eq("active", true).order("name");
  if (error) throw error;
  return (data ?? []) as ProductRecord[];
}

export async function listAdminProducts(): Promise<ProductRecord[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockStore.listProducts(true);
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as ProductRecord[];
}

export async function getAdminProduct(id: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockStore.getProduct(id);
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as ProductRecord | null;
}
