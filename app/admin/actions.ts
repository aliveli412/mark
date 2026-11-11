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
  if (!admin) {
    await supabase.auth.signOut();
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY is missing in .env.local. Add the service_role key from Supabase → Project Settings → API, then restart npm run dev.",
    };
  }

  let { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return {
      error: `Could not read profiles (run supabase/schema.sql first): ${profileError.message}`,
    };
  }

  const bootstrapEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL ?? "info@etki.co.uk")
    .trim()
    .toLowerCase();
  const signedInEmail = (user.email ?? email).trim().toLowerCase();
  const canBootstrap =
    Boolean(bootstrapEmail) && signedInEmail === bootstrapEmail;

  if (
    canBootstrap &&
    (!profile || (profile.role !== "super_admin" && profile.role !== "lodge_admin"))
  ) {
    const { error: upsertError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? email,
        full_name: "",
        role: "super_admin",
      },
      { onConflict: "id" },
    );
    if (upsertError) {
      await supabase.auth.signOut();
      return {
        error: `Could not promote admin profile (run supabase/schema.sql): ${upsertError.message}`,
      };
    }
    ({ data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .maybeSingle());
    if (profileError) {
      await supabase.auth.signOut();
      return { error: `Profile re-read failed: ${profileError.message}` };
    }
  }

  if (!profile) {
    await supabase.auth.signOut();
    return {
      error: `No profiles row for ${signedInEmail} (${user.id}). Run supabase/schema.sql then supabase/make-admin.sql.`,
    };
  }
  if (profile.role !== "super_admin" && profile.role !== "lodge_admin") {
    await supabase.auth.signOut();
    return {
      error: `Account role is "${profile.role}", not admin. Run supabase/make-admin.sql or set ADMIN_BOOTSTRAP_EMAIL=${signedInEmail} in .env.local.`,
    };
  }

  revalidatePath("/admin", "layout");
  // Localhost: server redirect keeps Set-Cookie on the same response (client assign was dropping the session).
  redirect(next);
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
  const title = String(formData.get("title") ?? "").trim();
  const payload = {
    title,
    slug: String(formData.get("slug") ?? "").trim() || slugify(title),
    summary: String(formData.get("summary") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    contact_phone: String(formData.get("contact_phone") ?? "").trim(),
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    starts_at: new Date(String(formData.get("starts_at") ?? "")).toISOString(),
    ends_at: String(formData.get("ends_at") ?? "")
      ? new Date(String(formData.get("ends_at"))).toISOString()
      : null,
    published: formData.get("published") === "on",
    rsvp_enabled: formData.get("rsvp_enabled") === "on",
    lodge_id: null as string | null,
  };
  if (!payload.title || !payload.slug || Number.isNaN(Date.parse(payload.starts_at))) {
    return { error: "Title and start date are required." };
  }

  if (!getSupabaseEnv().configured) {
    mockStore.saveEvent({ ...payload, id });
  } else {
    const supabase = createSupabaseAdminClient() ?? (await createSupabaseServerClient());
    if (!supabase) return { error: "Supabase is not configured." };
    if (id) {
      const { error } = await supabase.from("events").update(payload).eq("id", id);
      if (error) {
        return {
          error: `${error.message}. If columns are missing, run supabase/events-rsvp.sql.`,
        };
      }
    } else {
      const { error } = await supabase.from("events").insert(payload);
      if (error) {
        return {
          error: `${error.message}. If columns are missing, run supabase/events-rsvp.sql.`,
        };
      }
    }
  }

  revalidatePath("/admin/events");
  revalidatePath("/calendar");
  revalidatePath(`/calendar/${payload.slug}`);
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

export async function saveMembershipSettingsAction(
  formData: FormData,
): Promise<{ error?: string; next?: string }> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized.", next: "/admin/login" };
  const lodgeSlug = String(formData.get("lodge_slug") ?? "").trim();
  if (!lodgeSlug) return { error: "Lodge is required." };

  const { getMembershipSettings, saveMembershipSettings } = await import("@/lib/data/memberships");
  const current = await getMembershipSettings(lodgeSlug);
  const result = await saveMembershipSettings({
    lodge_slug: lodgeSlug,
    monthly_pence: Math.round(Number(formData.get("monthly") ?? 0) * 100),
    yearly_pence: Math.round(Number(formData.get("yearly") ?? 0) * 100),
    standing_order_pence: Math.round(Number(formData.get("standing_order") ?? 0) * 100),
    currency: "gbp",
    bank_name: String(formData.get("bank_name") ?? "").trim(),
    bank_account_name: String(formData.get("bank_account_name") ?? "").trim(),
    bank_sort_code: String(formData.get("bank_sort_code") ?? "").trim(),
    bank_account_number: String(formData.get("bank_account_number") ?? "").trim(),
    bank_reference_hint: String(formData.get("bank_reference_hint") ?? "").trim(),
    is_pilot: current.is_pilot ?? false,
    roster_source: current.roster_source ?? "",
    active: formData.get("active") === "on",
  });
  if (result.error) return { error: result.error };
  revalidatePath(`/admin/memberships/${lodgeSlug}`);
  revalidatePath(`/sites/${lodgeSlug}/membership`);
  return { next: `/admin/memberships/${lodgeSlug}` };
}

export async function saveRosterMemberAction(
  formData: FormData,
): Promise<{ error?: string; next?: string }> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized.", next: "/admin/login" };
  const lodgeSlug = String(formData.get("lodge_slug") ?? "").trim();
  const given = String(formData.get("given_names") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const fullName =
    String(formData.get("full_name") ?? "").trim() ||
    [given, surname].filter(Boolean).join(" ");
  const { upsertRosterMember } = await import("@/lib/data/memberships");
  const result = await upsertRosterMember({
    id: String(formData.get("id") ?? "") || undefined,
    lodge_slug: lodgeSlug,
    full_name: fullName,
    email: String(formData.get("email") ?? ""),
    membership_no: String(formData.get("brother_no") ?? formData.get("membership_no") ?? ""),
    brother_no: String(formData.get("brother_no") ?? ""),
    surname,
    given_names: given,
    prefix: String(formData.get("prefix") ?? ""),
    initials: String(formData.get("initials") ?? ""),
    title: String(formData.get("title") ?? ""),
    suffix: String(formData.get("suffix") ?? ""),
    home_phone: String(formData.get("home_phone") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    postcode: String(formData.get("postcode") ?? ""),
    address: String(formData.get("address") ?? ""),
    address2: String(formData.get("address2") ?? ""),
    address3: String(formData.get("address3") ?? ""),
    city: String(formData.get("city") ?? ""),
    county: String(formData.get("county") ?? ""),
    country: String(formData.get("country") ?? ""),
    activity: String(formData.get("activity") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    active: formData.get("active") === "on",
  });
  if (result.error) return { error: result.error };
  revalidatePath(`/admin/memberships/${lodgeSlug}`);
  return { next: `/admin/memberships/${lodgeSlug}` };
}

export async function importFwbRosterAction(): Promise<{ error?: string; next?: string }> {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized.", next: "/admin/login" };
  const { importFwbRosterSeed, FWB_LODGE_SLUG } = await import("@/lib/data/memberships");
  const result = await importFwbRosterSeed();
  if (result.error) return { error: result.error };
  revalidatePath(`/admin/memberships/${FWB_LODGE_SLUG}`);
  revalidatePath("/admin/memberships");
  revalidatePath(`/sites/${FWB_LODGE_SLUG}/membership`);
  return { next: `/admin/memberships/${FWB_LODGE_SLUG}` };
}

export async function deleteRosterMemberAction(formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  const id = String(formData.get("id") ?? "");
  const lodgeSlug = String(formData.get("lodge_slug") ?? "");
  if (!id) return;
  const { deleteRosterMember } = await import("@/lib/data/memberships");
  await deleteRosterMember(id);
  revalidatePath(`/admin/memberships/${lodgeSlug}`);
}

export async function setMembershipStatusAction(formData: FormData) {
  const session = await requireAdmin();
  if (!session) return;
  const id = String(formData.get("id") ?? "");
  const lodgeSlug = String(formData.get("lodge_slug") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "pending_match"
    | "matched"
    | "active"
    | "past_due"
    | "cancelled";
  if (!id || !status) return;
  const { setMembershipStatus } = await import("@/lib/data/memberships");
  await setMembershipStatus(id, status);
  revalidatePath(`/admin/memberships/${lodgeSlug}`);
  revalidatePath(`/sites/${lodgeSlug}/membership`);
}
