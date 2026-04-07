/**
 * 플랜별 서브에이전트 공통 타입 및 설정
 *
 * 각 서브에이전트는 PlanConfig를 받아 해당 플랜에 맞는 UI 검증을 수행합니다.
 */

export interface PlanConfig {
  /** DB의 subscription_plan 값 */
  id: string;
  /** 테스트 계정 이메일 */
  email: string;
  /** 테스트 계정 비밀번호 (플랜별 환경변수에서 로드) */
  password: string;
  /** 대시보드/계정 페이지에서 표시되는 플랜 레이블 */
  displayLabel: string;
  /** 유료 플랜 여부 (구독 관리 버튼 노출 여부) */
  hasManageSubscription: boolean;
}

/**
 * 플랜별 설정 목록
 * 이메일 패턴: e.b8k.maker+{plan_short}@gmail.com
 * 비밀번호: TEST_PASSWORD_{PLAN} 환경변수
 */
export const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: 'free',
    email: 'e.b8k.maker+free@gmail.com',
    password: process.env.TEST_PASSWORD_FREE!,
    displayLabel: 'Free',
    hasManageSubscription: false,
  },
  {
    id: 'starter',
    email: 'e.b8k.maker+starter@gmail.com',
    password: process.env.TEST_PASSWORD_STARTER!,
    displayLabel: 'Starter',
    hasManageSubscription: true,
  },
  {
    id: 'pro',
    email: 'e.b8k.maker+pro@gmail.com',
    password: process.env.TEST_PASSWORD_PRO!,
    displayLabel: 'Pro',
    hasManageSubscription: true,
  },
  {
    id: 'pay_per_use',
    // DB 확인 결과 이메일은 +pay 사용
    email: 'e.b8k.maker+pay@gmail.com',
    password: process.env.TEST_PASSWORD_PAY_PER_USE!,
    displayLabel: 'Pay per use',
    hasManageSubscription: true,
  },
  {
    id: 'publisher',
    email: 'e.b8k.maker+publisher@gmail.com',
    password: process.env.TEST_PASSWORD_PUBLISHER!,
    // planLabels 딕셔너리에 없어 raw 값이 표시됨
    displayLabel: 'publisher',
    hasManageSubscription: true,
  },
];
