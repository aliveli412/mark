import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function localCookieOptions(options?: Record<string, unknown>) {
  const sameSite = options?.sameSite;
  const normalizedSameSite =
    sameSite === true ? ("strict" as const) : sameSite === false ? ("lax" as const) : sameSite;
  const base = {
    ...options,
    path: (options?.path as string | undefined) ?? "/",
    sameSite: (normalizedSameSite as "lax" | "strict" | "none" | undefined) ?? "lax",
  };
  if (process.env.NODE_ENV !== "production") {
    return { ...base, secure: false };
  }
  return base;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdmin = path.startsWith("/admin");
  const isLogin = path === "/admin/login";
  if (!isAdmin) return NextResponse.next();

  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) {
    if (isLogin) return NextResponse.next();
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, localCookieOptions(options));
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isLogin && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
