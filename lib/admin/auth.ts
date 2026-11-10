import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types";

export async function getAdminSession() {
  // Admin never fails open. Without Supabase Auth there is no admin session.
  if (!getSupabaseEnv().configured) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile || (profile.role !== "super_admin" && profile.role !== "lodge_admin")) {
    return null;
  }

  return {
    mode: "live" as const,
    user: { id: user.id, email: user.email ?? profile.email },
    profile: profile as Profile,
  };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
