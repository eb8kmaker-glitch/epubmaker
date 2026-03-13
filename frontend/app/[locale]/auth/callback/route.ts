/**
 * Supabase Auth 콜백 핸들러.
 *
 * 이메일 인증 및 OAuth (Google 등) 완료 후 Supabase가 이 URL로 리다이렉트.
 * code를 세션으로 교환 후 /convert로 이동.
 *
 * 설정 필요: Supabase 대시보드 > Authentication > URL Configuration
 *   - Site URL: https://your-domain.com
 *   - Redirect URLs: https://your-domain.com/[locale]/auth/callback (각 로케일별 등록)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

type Props = { params: Promise<{ locale: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  const { locale } = await params;
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(`/${locale}/convert`, request.url));
}
