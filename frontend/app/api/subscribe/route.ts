import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

const BUTTONDOWN_API = "https://api.buttondown.email/v1/subscribers";
const RATE_LIMIT_PER_MINUTE = 10;

// ⚠️ DEBUG MODE — 프로덕션 배포 전 제거할 것
// 이 플래그를 true로 설정하면 응답에 진단 정보가 포함됩니다.
const DEBUG = true;

export async function POST(request: Request) {
  if (!checkRateLimit(request, RATE_LIMIT_PER_MINUTE)) {
    return NextResponse.json(
      { success: false, error: "too_many_requests" },
      { status: 429 }
    );
  }
  try {
    const token = process.env.BUTTONDOWN_API_KEY;

    // ── API 키 진단 ─────────────────────────────────────────────────────────
    const keyDiag = {
      exists: !!token,
      length: token?.length ?? 0,
      // 앞 4자리만 노출 (전체 노출 금지)
      prefix: token ? token.slice(0, 4) + "****" : "(없음)",
    };
    console.log("[subscribe:debug] BUTTONDOWN_API_KEY 진단:", JSON.stringify(keyDiag));

    if (!token) {
      console.error("[subscribe] BUTTONDOWN_API_KEY is not set");
      return NextResponse.json(
        {
          success: false,
          error: "service_unavailable",
          ...(DEBUG && { debug: { reason: "BUTTONDOWN_API_KEY 환경변수가 설정되지 않음", keyDiag } }),
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
    }

    // ── Buttondown API 호출 ──────────────────────────────────────────────────
    console.log(`[subscribe:debug] Buttondown 호출 시작 email=${email} endpoint=${BUTTONDOWN_API}`);

    let res: Response;
    try {
      res = await fetch(BUTTONDOWN_API, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error("[subscribe] Buttondown fetch 네트워크 오류:", msg);
      return NextResponse.json(
        {
          success: false,
          error: "network_error",
          ...(DEBUG && { debug: { reason: "Buttondown API fetch 자체 실패 (네트워크 오류)", message: msg } }),
        },
        { status: 502 }
      );
    }

    // ── 응답 body 파싱 ───────────────────────────────────────────────────────
    let bdBody: unknown = null;
    let bdRawText = "";
    try {
      bdRawText = await res.text();
      bdBody = bdRawText ? JSON.parse(bdRawText) : null;
    } catch {
      bdBody = null;
    }

    console.log(
      `[subscribe:debug] Buttondown 응답 status=${res.status} body=${bdRawText}`
    );

    // ── 에러 처리 ────────────────────────────────────────────────────────────
    if (!res.ok) {
      console.error(
        `[subscribe] Buttondown 오류 status=${res.status} email=${email}`,
        bdRawText
      );

      if (res.status === 400) {
        const bdObj = (typeof bdBody === "object" && bdBody !== null) ? bdBody as Record<string, unknown> : {};
        const emailErrors = bdObj?.email;
        const isAlreadySubscribed =
          Array.isArray(emailErrors) &&
          emailErrors.some(
            (msg) => typeof msg === "string" && msg.toLowerCase().includes("already exists")
          );
        if (isAlreadySubscribed) {
          return NextResponse.json(
            {
              success: false,
              error: "already_subscribed",
              ...(DEBUG && { debug: { bdStatus: res.status, bdBody } }),
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          {
            success: false,
            error: "validation_error",
            ...(DEBUG && { debug: { bdStatus: res.status, bdBody } }),
          },
          { status: 400 }
        );
      }

      if (res.status === 401) {
        console.error("[subscribe] Buttondown API 키 인증 실패 (401) — Vercel 환경변수의 BUTTONDOWN_API_KEY 값을 확인하세요");
        return NextResponse.json(
          {
            success: false,
            error: "api_key_invalid",
            ...(DEBUG && {
              debug: {
                bdStatus: res.status,
                bdBody,
                hint: "Buttondown API 키가 잘못되었습니다. Buttondown 대시보드 → Settings → API Keys에서 확인하세요.",
                keyDiag,
              },
            }),
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "service_error",
          ...(DEBUG && { debug: { bdStatus: res.status, bdBody } }),
        },
        { status: 502 }
      );
    }

    console.info(`[subscribe] 구독 성공 email=${email}`);
    return NextResponse.json({
      success: true,
      ...(DEBUG && { debug: { bdStatus: res.status, bdBody } }),
    });
  } catch (err) {
    console.error("[subscribe] 예기치 않은 오류:", err);
    return NextResponse.json(
      {
        success: false,
        error: "service_error",
        ...(DEBUG && { debug: { message: err instanceof Error ? err.message : String(err) } }),
      },
      { status: 500 }
    );
  }
}
