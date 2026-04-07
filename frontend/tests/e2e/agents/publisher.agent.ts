import { test, expect } from '@playwright/test';
import {
  login,
  logout,
  expectDashboardPlan,
  expectAccountPlan,
  expectConvertPageAccessible,
} from '../helpers/auth';
import type { PlanConfig } from './types';

/**
 * Publisher 플랜 서브에이전트
 *
 * 특이사항:
 *   dashboard/page.tsx의 planLabels 딕셔너리에 "publisher" 키가 없어
 *   planLabels[plan] ?? plan 로직에 의해 raw 값 "publisher"가 그대로 표시됩니다.
 *
 * 검증 항목:
 * - 로그인 성공
 * - 대시보드: "Plan: publisher" 표시 (raw 값, 대소문자 소문자)
 * - 대시보드: "Manage subscription" 버튼 표시
 * - 계정 페이지: "publisher" 플랜 표시
 * - 변환 페이지: 접근 가능
 */
export function runPublisherAgent(config: PlanConfig): void {
  test.beforeEach(async ({ page }) => {
    await login(page, config.email, config.password);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('로그인 성공', async ({ page }) => {
    expect(page.url()).not.toContain('/login');
  });

  test('대시보드: publisher 플랜 레이블 표시 (raw 값)', async ({ page }) => {
    // planLabels에 없으므로 raw "publisher" 문자열이 그대로 출력됨
    await expectDashboardPlan(page, config.displayLabel);
  });

  test('대시보드: 구독 관리 버튼 표시', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(
      page.getByRole('button', { name: 'Manage subscription' })
    ).toBeVisible();
  });

  test('계정 페이지: publisher 플랜 표시', async ({ page }) => {
    await expectAccountPlan(page, config.displayLabel);
  });

  test('변환 페이지: 접근 가능', async ({ page }) => {
    await expectConvertPageAccessible(page);
  });
}
