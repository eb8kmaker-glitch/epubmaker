# 보안 검토 결과

## 1. NEXT_PUBLIC_ 환경변수에 비밀키 노출

**결과: 🟢 문제 없음**

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon key는 클라이언트 공개용)
- `NEXT_PUBLIC_GOOGLE_*`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_APP_URL` 만 사용
- **service_role key, Stripe secret** 은 NEXT_PUBLIC_ 미사용 확인

---

## 2. 클라이언트 컴포넌트에서 createAdminClient import

**결과: 🟢 문제 없음**

- `createAdminClient` 사용처: `lib/supabase.ts`, `lib/storage.ts`, `app/api/convert`, `app/api/webhooks/stripe`, `app/api/webhooks/lemonsqueezy` (모두 서버)
- `'use client'` 파일에서는 import 없음 (useConversionLimit는 주석만 있음)

---

## 3. Stripe Webhook 서명 검증

**결과: 🟢 문제 없음**

- `app/api/webhooks/stripe/route.ts` 24–38행: `request.text()` 로 raw body 수신 후 `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)` 로 검증

---

## 4. 파일 업로드 API의 서버 MIME 검증

**결과: 🔴 1건 발견**

| 파일 | 줄 | 설명 | 위험도 |
|------|---|------|--------|
| `app/api/validate-epub/route.ts` | 7–12 | FormData에서 `epub` 파일만 존재 여부 확인, **실제 MIME/magic bytes 검증 없음**. 악의적 파일 업로드 가능 | 🔴 |

**수정 적용:** `app/api/validate-epub/route.ts` — EPUB magic bytes (ZIP 시그니처 `PK\x03\x04` 또는 `PK\x05\x06`) 검증 추가. 불일치 시 400 반환.

---

## 5. can_convert RPC 없이 변환하는 API

**결과: 🟢 문제 없음**

- `app/api/convert/route.ts` 202행: `admin.rpc("can_convert", { p_user_id: userId })` 호출 후 `allowed === false` 이면 429 반환
- 변환 처리 API는 convert 라우트 하나뿐이며, 해당 라우트에서 can_convert 사용 확인

---

## 6. try-catch 없이 await 사용하는 API 중요 로직

**결과: 🟡 1건 권장**

| 파일 | 줄 | 설명 | 위험도 |
|------|---|------|--------|
| `app/api/webhooks/stripe/route.ts` | 15–101 | 전체 POST 핸들러에 try-catch 없음. `constructEvent` 실패 시 400 반환하지만, 이후 supabase/stripe 호출 예외 시 500 미처리·스택 노출 가능 | 🟡 |

**수정 적용:** `app/api/webhooks/stripe/route.ts` — POST 핸들러 전체를 try-catch로 감쌌고, 예외 시 500 + 로그만 반환.

---

## 7. conversions 테이블 user_id 필터 없이 조회

**결과: 🟢 문제 없음**

- `app/[locale]/dashboard/page.tsx` 33–37행: `.eq("user_id", user.id)` 로 본인만 조회
- `app/api/convert/route.ts`: insert/update 시 `user_id` 또는 `id`(본 요청에서 생성한 레코드)로 제한
- `lib/storage.ts` cleanupExpiredFiles: 만료된 전체 레코드 정리용(의도된 동작), admin 전용

---

## 8. Stripe Webhook에서 이벤트 ID 중복 체크(멱등성) 없음

**결과: 🔴 1건 발견**

| 파일 | 줄 | 설명 | 위험도 |
|------|---|------|--------|
| `app/api/webhooks/stripe/route.ts` | 40–99 | `event.id`(stripe_event_id)로 기 처리 여부 확인 없이 바로 DB 업데이트. 동일 이벤트 재전송 시 중복 처리 가능 | 🔴 |

**수정 적용:** `app/api/webhooks/stripe/route.ts` — 처리 전 `stripe_webhook_events` 테이블에 `event_id` insert. unique violation(23505)이면 이미 처리된 이벤트로 간주하고 200 반환 후 스킵.  
**DB 마이그레이션 필요:** `stripe_webhook_events` 테이블 생성 (예: `event_id text primary key, created_at timestamptz default now()`).

---

## 9. 기타: 하드코딩된 API 키

**결과: 🔴 1건 발견**

| 파일 | 줄 | 설명 | 위험도 |
|------|---|------|--------|
| `app/api/subscribe/route.ts` | 4–5 | `BUTTONDOWN_TOKEN = process.env.BUTTONDOWN_API_KEY ?? "9092dfed-2e35-4be1-9405-906827764b7d"` — env 없을 때 **비밀키가 소스에 하드코딩** | 🔴 |

**수정 적용:** `app/api/subscribe/route.ts` — 하드코딩 fallback 제거. `BUTTONDOWN_API_KEY` 없으면 503 반환.

---

## 마이그레이션 (Stripe 웹훅 멱등성)

Supabase SQL 예시:

```sql
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  created_at timestamptz default now()
);
```
