import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

const BUTTONDOWN_API = "https://api.buttondown.email/v1/subscribers";
const RATE_LIMIT_PER_MINUTE = 10;

export async function POST(request: Request) {
  if (!checkRateLimit(request, RATE_LIMIT_PER_MINUTE)) {
    return NextResponse.json(
      { success: false, error: "too_many_requests" },
      { status: 429 }
    );
  }
  try {
    const token = process.env.BUTTONDOWN_API_KEY;
    if (!token) {
      console.error("[subscribe] BUTTONDOWN_API_KEY is not set");
      return NextResponse.json({ success: false, error: "service_unavailable" }, { status: 503 });
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
    }

    const res = await fetch(BUTTONDOWN_API, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email_address: email }),
    });

    let bdBody: Record<string, unknown> = {};
    try {
      bdBody = (await res.json()) as Record<string, unknown>;
    } catch {
      // JSON 파싱 실패 시 무시
    }

    if (!res.ok) {
      console.error(
        `[subscribe] Buttondown error status=${res.status} email=${email}`,
        JSON.stringify(bdBody)
      );

      if (res.status === 400) {
        // v1: email 필드, v2: email_address 필드로 에러 반환
        const errField = (bdBody?.email_address ?? bdBody?.email) as unknown;
        const isAlreadySubscribed =
          Array.isArray(errField) &&
          errField.some(
            (msg) => typeof msg === "string" && msg.toLowerCase().includes("already exists")
          );
        if (isAlreadySubscribed) {
          return NextResponse.json({ success: false, error: "already_subscribed" }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: "validation_error" }, { status: 400 });
      }

      if (res.status === 401) {
        console.error("[subscribe] Buttondown API key is invalid or unauthorized");
        return NextResponse.json({ success: false, error: "service_unavailable" }, { status: 503 });
      }

      return NextResponse.json({ success: false, error: "service_error" }, { status: 502 });
    }

    console.info(`[subscribe] Successfully subscribed email=${email}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[subscribe] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "service_error" }, { status: 500 });
  }
}
