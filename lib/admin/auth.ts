import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types";

export async function getAdminSession() {
  // Admin never fails open. Without Supabase Auth there is no admin session.
  if (!getSupabaseEnv().configured) return null;

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return null;

    // Read role with the service role so profiles RLS cannot recurse or block login.
    const admin = createSupabaseAdminClient();
    const reader = admin ?? supabase;
    const { data: profile, error: profileError } = await reader
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("admin profile lookup failed", profileError.message);
      return null;
    }
    if (!profile || (profile.role !== "super_admin" && profile.role !== "lodge_admin")) {
      return null;
    }

    return {
      mode: "live" as const,
      user: { id: user.id, email: user.email ?? profile.email },
      profile: profile as Profile,
    };
  } catch (error) {
    console.error("getAdminSession failed", error);
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?error=not_admin");
  return session;
}
