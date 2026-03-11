import { NextResponse } from "next/server";

const BUTTONDOWN_API = "https://api.buttondown.email/v1/subscribers";
const BUTTONDOWN_TOKEN =
  process.env.BUTTONDOWN_API_KEY ?? "9092dfed-2e35-4be1-9405-906827764b7d";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : null;

    if (!email) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const res = await fetch(BUTTONDOWN_API, {
      method: "POST",
      headers: {
        Authorization: `Token ${BUTTONDOWN_TOKEN}`,
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
