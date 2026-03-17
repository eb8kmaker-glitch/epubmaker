/**
 * Next.js middleware: i18n (next-intl) + 인증 보호.
 *
 * - 보호된 라우트: /[locale]/dashboard, /[locale]/convert → 로그인 필수.
 * - 공개 라우트: /, /[locale]/pricing, /api/webhooks/stripe (api는 matcher에서 제외되어 통과).
 * - 미인증 접근 시: /[locale]/login?redirect=원래URL 로 리다이렉트.
 * - 로그인 상태에서 /[locale]/login 접근 시: /[locale]/dashboard 로 리다이렉트.
 * - Supabase 세션 쿠키 갱신: createServerClient (Edge용 request/response 쿠키).
 */

import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const PROTECTED_SEGMENTS = ["dashboard", "convert", "account", "subscription"];
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
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
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
