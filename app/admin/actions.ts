"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function signInAction(formData: FormData) {
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

  redirect(next);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveEventAction(formData: FormData) {
  await requireAdmin();
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
    throw new Error("Title and start date are required.");
  }

  if (!getSupabaseEnv().configured) {
    mockStore.saveEvent({ ...payload, id });
  } else {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    if (id) {
      const { error } = await supabase.from("events").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("events").insert(payload);
      if (error) throw new Error(error.message);
    }
  }

  revalidatePath("/admin/events");
  revalidatePath("/calendar");
  redirect("/admin/events");
}

export async function deleteEventAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (!getSupabaseEnv().configured) mockStore.deleteEvent(id);
  else {
    const supabase = await createSupabaseServerClient();
    if (supabase) await supabase.from("events").delete().eq("id", id);
  }
  revalidatePath("/admin/events");
  revalidatePath("/calendar");
}

export async function savePostAction(formData: FormData) {
  await requireAdmin();
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
  if (!payload.title || !payload.slug) throw new Error("Title is required.");

  if (!getSupabaseEnv().configured) {
    mockStore.savePost({ ...payload, id });
  } else {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    if (id) {
      const { error } = await supabase.from("posts").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("posts").insert(payload);
      if (error) throw new Error(error.message);
    }
  }

  revalidatePath("/admin/news");
  revalidatePath("/blog");
  redirect("/admin/news");
}

export async function deletePostAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (!getSupabaseEnv().configured) mockStore.deletePost(id);
  else {
    const supabase = await createSupabaseServerClient();
    if (supabase) await supabase.from("posts").delete().eq("id", id);
  }
  revalidatePath("/admin/news");
  revalidatePath("/blog");
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();
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
    throw new Error("Name and price are required.");
  }

  if (!getSupabaseEnv().configured) {
    mockStore.saveProduct({ ...payload, id });
  } else {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    if (id) {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) throw new Error(error.message);
    }
  }

  revalidatePath("/admin/shop");
  revalidatePath("/shop");
  redirect("/admin/shop");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (!getSupabaseEnv().configured) mockStore.deleteProduct(id);
  else {
    const supabase = await createSupabaseServerClient();
    if (supabase) await supabase.from("products").delete().eq("id", id);
  }
  revalidatePath("/admin/shop");
  revalidatePath("/shop");
}
