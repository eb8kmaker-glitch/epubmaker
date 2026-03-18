/**
 * Supabase Auth 콜백 핸들러.
 *
 * 이메일 인증 및 OAuth (Google 등) 완료 후 Supabase가 이 URL로 리다이렉트.
 * code를 세션으로 교환 후 /convert로 이동.
 *
 * 설정 필요: Supabase 대시보드 > Authentication > URL Configuration
 *   - Site URL: https://your-domain.com
 *   - Redirect URLs: https://your-domain.com/[locale]/auth/callback (각 로케일별 등록)
 *
 * 주의: createServerClient() (next/headers 기반) 대신 response.cookies에 직접 쓰는
 *       방식을 사용해야 한다. exchangeCodeForSession()이 만드는 세션 쿠키를
 *       리다이렉트 응답에 포함시키기 위함.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type Props = { params: Promise<{ locale: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  const { locale } = await params;
  const code = request.nextUrl.searchParams.get("code");

  // 리다이렉트 응답을 먼저 생성하고, 세션 쿠키를 이 응답에 직접 씀
  const redirectUrl = new URL(`/${locale}/convert`, request.url);
  const response = NextResponse.redirect(redirectUrl);

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
            // 세션 쿠키를 리다이렉트 응답에 직접 설정
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, (options as Record<string, unknown>) ?? {});
            });
          },
        },
      });

      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return response;
}
