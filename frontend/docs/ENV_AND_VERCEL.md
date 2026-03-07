# 환경 변수 및 Vercel 배포 안내

## 로컬에서 DB 연결 정보 찾는 방법

프로젝트에는 연결 문자열이 저장되어 있지 않습니다. 아래 중 해당하는 경우를 참고하세요.

| 상황 | 확인 방법 |
|------|-----------|
| **로컬에 PostgreSQL 직접 설치** | 기본 포트 5432. 사용자/비밀번호는 설치 시 설정한 값. 예: `postgresql://postgres:비밀번호@localhost:5432/postgres` |
| **Docker로 Postgres 실행** | `docker-compose.yml` 또는 실행 시 `-e POSTGRES_USER`, `-e POSTGRES_PASSWORD`, `-e POSTGRES_DB` 확인 |
| **Neon / Supabase / Railway 등 클라우드** | 대시보드의 "Connection string" 또는 "Database URL" 복사 (보통 `postgresql://...` 형식) |
| **과거에 쓰던 .env가 있다면** | 다른 폴더나 백업에 `.env` 파일이 있는지 검색 |

형식: `postgresql://사용자명:비밀번호@호스트:포트/DB이름`

---

## Vercel 환경 변수 등록 시 주의사항

1. **localhost 사용 불가**  
   Vercel 서버는 당신 PC가 아니므로 `localhost`로 설정한 DB에는 접속할 수 없습니다.  
   → **반드시 외부에서 접근 가능한 DB URL**을 사용하세요 (Neon, Supabase, Railway, Vercel Postgres 등).

2. **동일 변수 이름**  
   Vercel 대시보드에서 Key를 `DATABASE_URL`로 그대로 두고, Value에 **배포용 DB** 연결 문자열을 넣으면 됩니다.

3. **환경(Environment) 선택**  
   Production만 쓰면 Production만 체크. Preview 브랜치에도 같은 DB를 쓰려면 Production, Preview 모두 체크.

4. **재배포**  
   환경 변수를 추가·수정한 뒤에는 한 번 **Redeploy** 해야 새 값이 반영됩니다.

5. **비밀번호 특수문자**  
   URL에 들어가는 비밀번호에 `@`, `#`, `%` 등이 있으면 **URL 인코딩**이 필요합니다.  
   예: `@` → `%40`, `#` → `%23`

6. **NextAuth 등**  
   `NEXTAUTH_URL`은 Vercel 배포 주소로 설정 (예: `https://your-app.vercel.app`).  
   `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`도 Vercel 환경 변수에 같이 등록하는 것이 좋습니다.
