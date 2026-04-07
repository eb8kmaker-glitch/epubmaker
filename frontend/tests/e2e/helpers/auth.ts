import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * 이메일/비밀번호로 로그인하고 로그인 페이지에서 벗어날 때까지 대기합니다.
 * 로그인 후 redirect 파라미터가 없으면 /en/convert 로 이동합니다.
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/en/login');

  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  // 로그인 성공: /login 경로 벗어날 때까지 대기
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15_000,
  });
}

/**
 * 현재 세션을 종료합니다 (쿠키/스토리지 초기화).
 * 다음 테스트가 다른 계정으로 로그인할 수 있도록 보장합니다.
 */
export async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
}

/**
 * 대시보드 플랜 표시 텍스트를 검증합니다.
 * dashboard/page.tsx: <p>{t("plan")}: {planLabels[plan] ?? plan}</p>
 */
export async function expectDashboardPlan(page: Page, displayLabel: string): Promise<void> {
  await page.goto('/en/dashboard');
  await expect(page.getByText(`Plan: ${displayLabel}`)).toBeVisible();
}

/**
 * 계정 페이지 플랜 표시를 검증합니다.
 * account/page.tsx: <p>{planLabels[plan] ?? plan}</p>
 */
export async function expectAccountPlan(page: Page, displayLabel: string): Promise<void> {
  await page.goto('/en/account');
  // "Plan" 레이블 섹션 내의 플랜 값 확인
  const planSection = page.locator('section').filter({ hasText: 'Plan' }).first();
  await expect(planSection.getByText(displayLabel, { exact: true })).toBeVisible();
}

/**
 * 변환 페이지 접근 가능 여부를 검증합니다.
 */
export async function expectConvertPageAccessible(page: Page): Promise<void> {
  await page.goto('/en/convert');
  await expect(page.getByRole('heading', { name: 'Upload your document' })).toBeVisible();
  // 파일 업로드 드롭존 존재 확인
  await expect(page.locator('input[type="file"]')).toBeAttached();
}
