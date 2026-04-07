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
 * Pay Per Use 플랜 서브에이전트
 *
 * 검증 항목:
 * - 로그인 성공
 * - 대시보드: "Plan: Pay per use" 표시
 * - 대시보드: "Manage subscription" 버튼 표시
 * - 계정 페이지: "Pay per use" 플랜 표시
 * - 변환 페이지: 접근 가능
 */
export function runPayPerUseAgent(config: PlanConfig): void {
  test.beforeEach(async ({ page }) => {
    await login(page, config.email, config.password);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('로그인 성공', async ({ page }) => {
    expect(page.url()).not.toContain('/login');
  });

  test('대시보드: Pay per use 플랜 레이블 표시', async ({ page }) => {
    await expectDashboardPlan(page, config.displayLabel);
  });

  test('대시보드: 구독 관리 버튼 표시', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(
      page.getByRole('button', { name: 'Manage subscription' })
    ).toBeVisible();
  });

  test('계정 페이지: Pay per use 플랜 표시', async ({ page }) => {
    await expectAccountPlan(page, config.displayLabel);
  });

  test('변환 페이지: 접근 가능', async ({ page }) => {
    await expectConvertPageAccessible(page);
  });
}
