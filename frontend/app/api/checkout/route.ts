/**
 * Lemon Squeezy Checkout URL 생성.
 *
 * POST body: { plan: 'starter' | 'pro' }
 * Supabase: createServerClient()로 세션에서 userId 확인 (없으면 401).
 * createAdminClient()는 사용하지 않음 (checkout 시점에는 users 업데이트 없음).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  createCheckout,
  LEMON_STORE_ID,
  LEMON_STARTER_VARIANT_ID,
  LEMON_PRO_VARIANT_ID,
  type CheckoutPlan,
} from "@/lib/lemonsqueezy";

const VARIANT_IDS: Record<CheckoutPlan, string> = {
  starter: LEMON_STARTER_VARIANT_ID ?? "",
  pro: LEMON_PRO_VARIANT_ID ?? "",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const plan = body?.plan as CheckoutPlan | undefined;
    if (!plan || (plan !== "starter" && plan !== "pro")) {
      return NextResponse.json(
        { error: "Invalid or missing plan. Use 'starter' or 'pro'." },
        { status: 400 }
      );
    }

    const variantId = VARIANT_IDS[plan];
    if (!variantId) {
      return NextResponse.json(
        { error: `Variant ID not configured for plan: ${plan}` },
        { status: 500 }
      );
    }

    const baseUrl =
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const redirectUrl = `${baseUrl}/dashboard`;

    const { url } = await createCheckout({
      variantId,
      custom: { userId: user.id, plan },
      redirectUrl,
      email: user.email ?? undefined,
    });

    return NextResponse.json({ url });
  } catch (e) {
    console.error("[checkout]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
