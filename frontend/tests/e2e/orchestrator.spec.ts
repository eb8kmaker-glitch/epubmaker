/**
 * 플랜별 E2E 테스트 오케스트레이터
 *
 * 구조:
 *   - PLAN_CONFIGS: Supabase users 테이블의 플랜별 계정 설정
 *   - 각 플랜마다 전용 서브에이전트(agent)를 호출
 *   - 서브에이전트는 해당 플랜의 UI 동작을 독립적으로 검증
 *
 * 플랜 목록: free, starter, pro, pay_per_use, publisher
 * 계정 패턴: e.b8k.maker+{plan_short}@gmail.com
 *
 * 실행:
 *   npx playwright test tests/e2e/orchestrator.spec.ts
 *
 * 사전 조건:
 *   1. .env.test 파일에 TEST_ACCOUNT_PASSWORD 설정
 *   2. 로컬 서버 실행: npm run dev (http://localhost:3000)
 */

import { test } from '@playwright/test';
import { PLAN_CONFIGS, type PlanConfig } from './agents/types';
import { runFreeAgent } from './agents/free.agent';
import { runStarterAgent } from './agents/starter.agent';
import { runProAgent } from './agents/pro.agent';
import { runPayPerUseAgent } from './agents/pay-per-use.agent';
import { runPublisherAgent } from './agents/publisher.agent';

// 플랜 ID → 서브에이전트 함수 매핑
const AGENT_MAP: Record<string, (config: PlanConfig) => void> = {
  free: runFreeAgent,
  starter: runStarterAgent,
  pro: runProAgent,
  pay_per_use: runPayPerUseAgent,
  publisher: runPublisherAgent,
};

// 각 플랜에 대해 독립된 describe 블록 생성
for (const config of PLAN_CONFIGS) {
  const agent = AGENT_MAP[config.id];

  if (!agent) {
    throw new Error(`[Orchestrator] 알 수 없는 플랜: ${config.id}`);
  }

  test.describe(`[${config.id.toUpperCase()}] ${config.displayLabel} 플랜 검증`, () => {
    // 서브에이전트에 플랜 설정 주입 — 에이전트 내부에서 beforeEach/afterEach 등록
    agent(config);
  });
}
