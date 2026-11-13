import type { CookieOptions } from "@supabase/ssr";

/** Local http://localhost rejects Secure cookies — strip that flag in development. */
export function localCookieOptions(options?: CookieOptions): CookieOptions {
  const base = { ...options, path: options?.path ?? "/", sameSite: options?.sameSite ?? "lax" };
  if (process.env.NODE_ENV !== "production") {
    return { ...base, secure: false };
  }
  return base;
}
