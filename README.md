# epubmaker

## Vercel 배포 설정

앱은 `frontend` 폴더에 있습니다. Vercel에서 정상 빌드하려면:

1. **Vercel 대시보드** → 프로젝트 선택 → **Settings** → **General**
2. **Root Directory**를 `frontend`로 설정 (또는 **Edit** 후 `frontend` 입력 후 **Save**)
3. **Build Command**: `npm run build` (기본값 유지, `frontend/package.json`의 스크립트 사용)
4. **Output Directory**: Next.js 기본값 유지
5. **Install Command**: `npm install` (기본값)

Root Directory를 `frontend`로 두면 Vercel이 `frontend/package.json`을 기준으로 빌드합니다.