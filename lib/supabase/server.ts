import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { localCookieOptions } from "@/lib/supabase/cookie-options";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, localCookieOptions(options));
          });
        } catch {
          // Server Components cannot always set cookies; middleware refreshes the session.
        }
      },
    },
  });
}
