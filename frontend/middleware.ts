/**
 * Next.js middleware: i18n (next-intl) + auth protection.
 *
 * Protected routes: /[locale]/dashboard, /[locale]/account, /[locale]/admin
 * Public: everything else — including /convert (no login required).
 */

import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const PROTECTED_SEGMENTS = ["dashboard", "account", "admin"];
const LOGIN_SEGMENT = "login";

function isProtectedPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const segment1 = segments[1];
  return segment1 != null && PROTECTED_SEGMENTS.includes(segment1);
}

function isLoginPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments[1] === LOGIN_SEGMENT;
}

function getLocaleFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];
  return locale && (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const intlMiddleware = createIntlMiddleware(routing);
  let response = intlMiddleware(request);

  // Skip Supabase auth entirely for public paths — avoids cold-start latency
  if (!isProtectedPath(pathname) && !isLoginPath(pathname)) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    let user: { email?: string } | null = null;
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, (options as Record<string, unknown>) ?? {});
            });
          },
        },
      });

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 1000)
      );
      const authPromise = supabase.auth.getUser().then((res) => res.data.user);
      user = await Promise.race([authPromise, timeoutPromise]);
    } catch {
      // Fall through with no session — do not block the request
    }
    const hasSession = !!user;

    if (isProtectedPath(pathname) && !hasSession) {
      const locale = getLocaleFromPath(pathname);
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isLoginPath(pathname) && hasSession) {
      const locale = getLocaleFromPath(pathname);
      const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // Admin: only allow ADMIN_EMAIL
    const segments = pathname.split("/").filter(Boolean);
    if (segments[1] === "admin" && hasSession) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail || user?.email !== adminEmail) {
        const locale = getLocaleFromPath(pathname);
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
