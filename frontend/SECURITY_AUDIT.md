# 보안 점검 결과 (Security Audit)

점검일: 2025-03 기준. 다음 4개 영역을 검토함.

---

## 1. 인증/세션 보안

### 1.1 미들웨어 보호 경로

**결과: 🟢 적절**

- `PROTECTED_SEGMENTS = ["dashboard", "convert", "account", "subscription"]` 로 페이지 경로 보호.
- `config.matcher`가 `api`, `_next`, 정적 파일을 제외하므로 **API 라우트는 미들웨어를 거치지 않음**. 각 API가 자체 인증 필요.

### 1.2 API 라우트 인증 (401 처리)

| 라우트 | 인증 여부 | 비고 |
|--------|-----------|------|
| `POST /api/convert` | ✅ `getUser()` 후 401 | 정상 |
| `POST /api/checkout` | ✅ `getUser()` 후 401 | 정상 |
| `POST /api/portal` | ✅ `getUser()` 후 401 | 정상 |
| `POST /api/webhooks/lemonsqueezy` | N/A | 서명 검증으로 대체 |
| `POST /api/import-notion` | ❌ **없음** | **심각** |
| `POST /api/subscribe` | ❌ 없음 | 뉴스레터 가입용(의도적일 수 있음) |
| `POST /api/validate-epub` | ❌ 없음 | 공개 검증 API |

**발견: 🔴 심각 — `/api/import-notion` 인증 없음**

- 누구나 URL만 보내면 서버의 `NOTION_API_KEY` / `NOTION_INTEGRATION_SECRET`으로 Notion 페이지를 가져옴.
- **영향:** Notion API 할당량/비용 남용, 내부 정보 노출 가능.
- **권장:** 로그인 필수로 변경하거나, API 키 사용량/호출 주체 제한(예: rate limit + 인증).

### 1.3 서버 액션 유저 검증

**결과: 🟢 적절**

- `app/actions/auth.ts`
  - `signOut`: `createServerClient()`로 세션만 사용 → 본인 세션만 로그아웃.
  - `changePassword`: `updateUser({ password })` → 현재 세션 사용자만 변경.
  - `deleteAccount`: `getUser()`로 현재 사용자 확인 후 `admin.auth.admin.deleteUser(user.id)` → 본인만 삭제.

### 1.4 미들웨어 세션 검사 방식

**결과: 🟡 권장 개선**

- 현재: `getSession()` 사용.
- Supabase 권장: 중요한 인증 결정에는 `getUser()` 사용. `getSession()`은 캐시된 값을 줄 수 있어, 토큰 폐기/계정 삭제 후에도 짧은 시간 동안 보호 구간 접근이 가능함.
- **권장:** Edge에서 가능하다면 미들웨어에서도 `getUser()`로 세션 검사하거나, 최소한 보호 구간 페이지에서 서버 컴포넌트의 `getUser()` 리다이렉트에 의존하고 있음을 인지. (현재 페이지들은 모두 서버에서 `getUser()` 후 redirect 하므로 이중 방어됨.)

---

## 2. 데이터 보호

### 2.1 Supabase RLS (Row Level Security)

**결과: 🟡 코드베이스만으로는 확인 불가**

- 저장소에는 Supabase RLS 정책을 정의한 SQL 마이그레이션이 없음.
- `useUser.ts` 등에서는 anon key + RLS 가정으로 `users` 조회.
- **권장:** Supabase 대시보드 또는 별도 마이그레이션에서 다음 확인:
  - `users`: 본인 행만 읽기/수정 가능 (예: `auth.uid() = id`).
  - `conversions`: 본인 행만 읽기/삽입/갱신 (예: `auth.uid() = user_id`).
  - `profiles`, `subscription_events` 등도 동일하게 본인/서버만 접근하도록 정책 존재 여부 확인.

### 2.2 타 유저 데이터 접근 (IDOR)

**결과: 🟢 문제 없음**

- **Dashboard:** `createServerClient()`로 `conversions` 조회 시 `.eq("user_id", user.id)` 사용.
- **Convert API:** `userId`는 항상 `getUser()` 결과만 사용. `conversionId`는 해당 요청에서 방금 삽입한 행의 `id`. 다운로드 URL은 `userId/conversionId/output.epub`로 생성되어 타 유저 경로 노출 없음.
- **Portal API:** `createAdminClient()`로 `users` 조회 시 `.eq("id", user.id)` — 세션 사용자만 조회 후 `lemon_customer_id` 사용. 본인만 포털 URL 발급.

### 2.3 Admin 클라이언트 노출

**결과: 🟢 문제 없음**

- `createAdminClient()` 사용처: `lib/supabase.ts`, `lib/storage.ts`, `app/api/convert`, `app/api/portal`, `app/api/webhooks/lemonsqueezy`, `app/actions/auth.ts` — 모두 서버 전용.
- `'use client'` 파일에서는 import 없음. 서버 액션/API/스토리지 유틸에서만 사용.

---

## 3. 결제 보안

### 3.1 Lemon Squeezy Webhook 서명 검증

**결과: 🟢 적절**

- `x-signature` 헤더로 HMAC-SHA256 검증.
- `verifySignature(rawBody, signature)`: `crypto.timingSafeEqual` 사용.
- `LEMONSQUEEZY_WEBHOOK_SECRET` 없거나 시그니처 없으면 `false` 반환 → 401.
- raw body는 `request.text()`로 수신 후 검증에만 사용 (JSON 파싱은 검증 이후).

### 3.2 Checkout / Portal API 본인 확인

**결과: 🟢 적절**

- **Checkout:** `getUser()`로 확인 후 `user.id`, `user.email`만 `createCheckout` custom/email에 전달. URL은 본인 결제용으로만 생성됨.
- **Portal:** `getUser()` 후 `admin.from("users").select("lemon_customer_id").eq("id", user.id)`로 본인 레코드만 조회. 해당 `lemon_customer_id`로만 포털 URL 발급.

---

## 4. 환경변수

**결과: 🟢 민감 키 클라이언트 노출 없음**

- **NEXT_PUBLIC_* 사용:**  
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_*`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_APP_URL` — anon/공개용 또는 공개 가능한 값만 사용.
- **서버 전용 (NEXT_PUBLIC 미사용):**  
  `SUPABASE_SERVICE_ROLE_KEY`, `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `NOTION_*`, `BUTTONDOWN_API_KEY` 등 — 클라이언트 번들에 노출되지 않음.
- `app/api/subscribe/route.ts`: 하드코딩 폴백 제거됨. `BUTTONDOWN_API_KEY` 없으면 503 반환.

---

## 발견된 문제 요약 (심각도 순)

### 🔴 심각

1. **`/api/import-notion` 인증 없음**
   - **내용:** 로그인/API 키 없이 누구나 Notion URL을 보내 서버의 Notion API로 페이지를 가져올 수 있음.
   - **위험:** 할당량/비용 남용, 내부 Notion 페이지 정보 유출 가능.
   - **권장:**  
     - `createServerClient()` + `getUser()`로 인증 후 401 처리하거나,  
     - 별도 API 키/토큰 검증 또는 강한 rate limit 적용.

### 🟡 권장 개선

2. **미들웨어에서 `getSession()` 사용**
   - **내용:** 세션 폐기/계정 삭제 후에도 캐시로 인해 짧은 시간 보호 구간 접근 가능.
   - **권장:** Edge 지원 범위 내에서 `getUser()` 사용 검토. 현재는 보호 페이지가 서버에서 한 번 더 `getUser()` 후 리다이렉트하므로 실질적 이중 방어는 있음.

3. **RLS 정책 코드/문서 부재**
   - **내용:** RLS가 Supabase 대시보드에만 있을 수 있어, 코드베이스만으로는 정책 검증이 어렵음.
   - **권장:** RLS 정책을 SQL 마이그레이션으로 관리하거나, 최소한 대시보드 정책을 문서화해 `users`, `conversions`, `profiles` 등에 본인/서버만 접근하도록 되어 있는지 정기 점검.

### 🟢 참고 (낮은 위험)

4. **공개 API: `/api/subscribe`, `/api/validate-epub`**
   - 인증 없음이 의도된 공개 동작일 수 있음. 남용 방지를 위해 rate limit 적용 권장.

---

## 조치 체크리스트

- [ ] `/api/import-notion`: 인증 추가 또는 rate limit + 모니터링
- [ ] 미들웨어: 가능 시 `getUser()` 사용 검토
- [ ] RLS: 대시보드 정책 확인 또는 마이그레이션/문서화
- [ ] (선택) `/api/subscribe`, `/api/validate-epub`: rate limit 추가
