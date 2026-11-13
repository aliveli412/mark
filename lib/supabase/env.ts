export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return { url, anonKey, serviceRoleKey, configured: Boolean(url && anonKey) };
}
