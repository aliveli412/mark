import { mockStore } from "@/lib/data/mock-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { EventRecord, PostRecord, ProductRecord } from "@/lib/types";

export function usingSampleData() {
  return !getSupabaseEnv().configured;
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
    return (data ?? []) as EventRecord[];
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
    return (data ?? []) as EventRecord[];
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
    return data as EventRecord | null;
  } catch {
    return mockStore.getEvent(id);
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
