import { NextResponse } from "next/server";

const BUTTONDOWN_API = "https://api.buttondown.email/v1/subscribers";

export async function POST(request: Request) {
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
