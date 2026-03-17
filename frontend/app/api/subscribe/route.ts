import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

const BUTTONDOWN_API = "https://api.buttondown.email/v1/subscribers";
const RATE_LIMIT_PER_MINUTE = 10;

export async function POST(request: Request) {
  if (!checkRateLimit(request, RATE_LIMIT_PER_MINUTE)) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429 }
    );
  }
  try {
    const token = process.env.BUTTONDOWN_API_KEY;
    if (!token) {
      console.error("[subscribe] BUTTONDOWN_API_KEY is not set");
      return NextResponse.json({ success: false }, { status: 503 });
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : null;

    if (!email) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const res = await fetch(BUTTONDOWN_API, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      return NextResponse.json({ success: false }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
