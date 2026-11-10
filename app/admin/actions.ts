"use server";

import { revalidatePath } from "next/cache";
import { mockStore } from "@/lib/data/mock-store";
import { requireAdmin } from "@/lib/admin/auth";
import { safeAdminNextPath } from "@/lib/admin/paths";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export type SignInState = { error?: string; ok?: boolean; next?: string } | null;

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeAdminNextPath(String(formData.get("next") ?? "/admin"));

  if (!getSupabaseEnv().configured) {
    return { error: "Admin sign-in requires Supabase. Add the project secrets first." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign-in failed." };

  const admin = createSupabaseAdminClient();
  const reader = admin ?? supabase;
  const { data: profile, error: profileError } = await reader
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return { error: `Could not read profile: ${profileError.message}` };
  }
  if (!profile || (profile.role !== "super_admin" && profile.role !== "lodge_admin")) {
    await supabase.auth.signOut();
    return {
      error:
        "This account is not an admin. In Supabase SQL, insert/update profiles.role to super_admin for your Auth user.",
    };
  }

  // Do not call redirect() — on some hosts the NEXT_REDIRECT digest is shown as Application error.
  revalidatePath("/admin", "layout");
  return { ok: true, next };
}

export async function signOutAction(): Promise<{ ok: true; next: string }> {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/admin", "layout");
  return { ok: true, next: "/admin/login" };
}

export async function saveEventAction(formData: FormData): Promise<{ error?: string; next?: string }> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized.", next: "/admin/login" };

  const id = String(formData.get("id") ?? "") || undefined;
  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    starts_at: new Date(String(formData.get("starts_at") ?? "")).toISOString(),
    ends_at: String(formData.get("ends_at") ?? "")
      ? new Date(String(formData.get("ends_at"))).toISOString()
      : null,
    published: formData.get("published") === "on",
    lodge_id: null as string | null,
  };
  if (!payload.title || Number.isNaN(Date.parse(payload.starts_at))) {
    return { error: "Title and start date are required." };
  }

  if (!getSupabaseEnv().configured) {
    mockStore.saveEvent({ ...payload, id });
  } else {
    const supabase = createSupabaseAdminClient() ?? (await createSupabaseServerClient());
    if (!supabase) return { error: "Supabase is not configured." };
    if (id) {
      const { error } = await supabase.from("events").update(payload).eq("id", id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("events").insert(payload);
      if (error) return { error: error.message };
    }
  }

  revalidatePath("/admin/events");
  revalidatePath("/calendar");
  return { next: "/admin/events" };
}

export async function deleteEventAction(formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (!getSupabaseEnv().configured) mockStore.deleteEvent(id);
  else {
    const supabase = createSupabaseAdminClient() ?? (await createSupabaseServerClient());
    if (supabase) await supabase.from("events").delete().eq("id", id);
  }
  revalidatePath("/admin/events");
  revalidatePath("/calendar");
}

export async function savePostAction(formData: FormData): Promise<{ error?: string; next?: string }> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized.", next: "/admin/login" };

  const id = String(formData.get("id") ?? "") || undefined;
  const title = String(formData.get("title") ?? "").trim();
  const published = formData.get("published") === "on";
  const payload = {
    title,
    slug: String(formData.get("slug") ?? "").trim() || slugify(title),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    published,
    published_at: published ? new Date().toISOString() : null,
    lodge_id: null as string | null,
  };
  if (!payload.title || !payload.slug) return { error: "Title is required." };

  if (!getSupabaseEnv().configured) {
    mockStore.savePost({ ...payload, id });
  } else {
    const supabase = createSupabaseAdminClient() ?? (await createSupabaseServerClient());
    if (!supabase) return { error: "Supabase is not configured." };
    if (id) {
      const { error } = await supabase.from("posts").update(payload).eq("id", id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("posts").insert(payload);
      if (error) return { error: error.message };
    }
  }

  revalidatePath("/admin/news");
  revalidatePath("/blog");
  return { next: "/admin/news" };
}

export async function deletePostAction(formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (!getSupabaseEnv().configured) mockStore.deletePost(id);
  else {
    const supabase = createSupabaseAdminClient() ?? (await createSupabaseServerClient());
    if (supabase) await supabase.from("posts").delete().eq("id", id);
  }
  revalidatePath("/admin/news");
  revalidatePath("/blog");
}

export async function saveProductAction(formData: FormData): Promise<{ error?: string; next?: string }> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized.", next: "/admin/login" };

  const id = String(formData.get("id") ?? "") || undefined;
  const name = String(formData.get("name") ?? "").trim();
  const payload = {
    name,
    slug: String(formData.get("slug") ?? "").trim() || slugify(name),
    description: String(formData.get("description") ?? "").trim(),
    price_pence: Math.round(Number(formData.get("price") ?? 0) * 100),
    image_path: String(formData.get("image_path") ?? "").trim() || "/images/mug.jpg",
    active: formData.get("active") === "on",
  };
  if (!payload.name || Number.isNaN(payload.price_pence)) {
    return { error: "Name and price are required." };
  }

  if (!getSupabaseEnv().configured) {
    mockStore.saveProduct({ ...payload, id });
  } else {
    const supabase = createSupabaseAdminClient() ?? (await createSupabaseServerClient());
    if (!supabase) return { error: "Supabase is not configured." };
    if (id) {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) return { error: error.message };
    }
  }

  revalidatePath("/admin/shop");
  revalidatePath("/shop");
  return { next: "/admin/shop" };
}

export async function deleteProductAction(formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (!getSupabaseEnv().configured) mockStore.deleteProduct(id);
  else {
    const supabase = createSupabaseAdminClient() ?? (await createSupabaseServerClient());
    if (supabase) await supabase.from("products").delete().eq("id", id);
  }
  revalidatePath("/admin/shop");
  revalidatePath("/shop");
}
