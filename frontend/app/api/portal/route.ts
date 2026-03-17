/**
 * Lemon Squeezy Customer Portal URL 반환 (구독/결제 수단 관리).
 *
 * Supabase: createServerClient() — 쿠키로 현재 사용자 확인.
 *          createAdminClient() — users 테이블에서 lemon_customer_id 조회.
 * Lemon Squeezy: getCustomer() → attributes.urls.customer_portal
 * 환경변수: LEMONSQUEEZY_API_KEY
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase";
import { getCustomerPortalUrl } from "@/lib/lemonsqueezy";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: row } = await admin
      .from("users")
      .select("lemon_customer_id")
      .eq("id", user.id)
      .single();

    const customerId = row?.lemon_customer_id ?? null;
    if (!customerId || typeof customerId !== "string") {
      return NextResponse.json(
        { error: "구독 정보가 없습니다" },
        { status: 404 }
      );
    }

    const { url } = await getCustomerPortalUrl(customerId);
    if (!url) {
      return NextResponse.json(
        { error: "구독 정보가 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ url });
  } catch (e) {
    Sentry.captureException(e);
    console.error("[portal]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Portal failed" },
      { status: 500 }
    );
  }
}
