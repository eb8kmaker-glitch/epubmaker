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
 * Free 플랜 서브에이전트
 *
 * 검증 항목:
 * - 로그인 성공
 * - 대시보드: "Plan: Free" 표시
 * - 대시보드: "Manage subscription" 버튼 없음 (무료 플랜 전용)
 * - 대시보드: "Change plan" 링크 표시
 * - 계정 페이지: "Free" 플랜 표시
 * - 변환 페이지: 접근 가능, 파일 업로드 UI 표시
 */
export function runFreeAgent(config: PlanConfig): void {
  test.beforeEach(async ({ page }) => {
    await login(page, config.email, config.password);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('로그인 성공 후 변환 페이지로 이동', async ({ page }) => {
    // 로그인은 beforeEach에서 완료됨 — URL 확인
    expect(page.url()).toContain('/en/');
    expect(page.url()).not.toContain('/login');
  });

  test('대시보드: Free 플랜 레이블 표시', async ({ page }) => {
    await expectDashboardPlan(page, config.displayLabel);
  });

  test('대시보드: 구독 관리 버튼 없음 (무료 플랜)', async ({ page }) => {
    await page.goto('/en/dashboard');
    // plan !== "free" 조건에 의해 버튼이 렌더링되지 않음
    await expect(
      page.getByRole('button', { name: 'Manage subscription' })
    ).toHaveCount(0);
  });

  test('대시보드: 플랜 변경 링크 표시', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(page.getByRole('link', { name: 'Change plan' })).toBeVisible();
  });

  test('계정 페이지: Free 플랜 표시', async ({ page }) => {
    await expectAccountPlan(page, config.displayLabel);
  });

  test('변환 페이지: 접근 가능 및 파일 업로드 UI 표시', async ({ page }) => {
    await expectConvertPageAccessible(page);
  });
}
