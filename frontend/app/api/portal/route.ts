/**
 * Stripe Customer Portal 세션 생성 (구독 관리/결제 수단 변경).
 *
 * Supabase: createServerClient() — 쿠키로 현재 사용자 확인 후 profiles 에서 stripe_customer_id 조회.
 * Stripe: stripe.billingPortal.sessions.create()
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const customerId = profile?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: "No billing customer found" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const returnUrl = (body as { returnUrl?: string }).returnUrl ?? request.nextUrl.origin + "/dashboard";

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[portal]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Portal failed" },
      { status: 500 }
    );
  }
}
