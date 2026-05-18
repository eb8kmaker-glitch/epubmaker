"use client";
/**
 * AdFitBanner — 카카오 애드핏 배너 컴포넌트
 *
 * ── 광고 코드 삽입 방법 ────────────────────────────────────────────────────
 * 1. 애드핏 심사 승인 후 .env.local 에 아래 항목 추가:
 *      NEXT_PUBLIC_ADFIT_ENABLED=true
 *
 * 2. 각 사용처에서 adUnit prop 에 발급받은 단위 ID 를 전달:
 *      <AdFitBanner adUnit="DAN-xxxxxxxxxx" />
 *
 * 3. 필요 시 desktopSize / mobileSize prop 으로 크기 변경
 *
 * ── 비활성 상태 동작 ──────────────────────────────────────────────────────
 * NEXT_PUBLIC_ADFIT_ENABLED 가 설정되지 않으면 min-height 만 유지하는
 * 투명 영역을 렌더합니다 (CLS 방지, 레이아웃 안정화).
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from "react";

// ── 애드핏 지원 광고 크기 프리셋 ─────────────────────────────────────────────
// 참고: https://adfit.kakao.com/
const SIZE_MAP = {
  "320x50":  { width: 320, height: 50  }, // 모바일 배너 (기본)
  "300x250": { width: 300, height: 250 }, // 중간 직사각형
  "728x90":  { width: 728, height: 90  }, // 리더보드 (데스크탑 기본)
  "970x90":  { width: 970, height: 90  }, // 와이드 리더보드
} as const;

type AdSize = keyof typeof SIZE_MAP;

// ── 환경 변수 ─────────────────────────────────────────────────────────────────
// .env.local 에 NEXT_PUBLIC_ADFIT_ENABLED=true 추가 시 광고 활성화
const ADFIT_ENABLED = process.env.NEXT_PUBLIC_ADFIT_ENABLED === "true";

// 모바일/데스크탑 분기 기준 (px)
const MOBILE_BP = 768;

// ── 애드핏 스크립트 동적 삽입 (페이지당 1회) ─────────────────────────────────
function injectAdFitScript() {
  if (typeof document === "undefined") return;
  if (document.querySelector('script[data-adfit-injected]')) return;

  const script = document.createElement("script");
  // !! 광고 스크립트 URL — 변경하지 마세요 !!
  script.src = "//t1.daumcdn.net/kas/static/ba.min.js";
  script.async = true;
  script.setAttribute("data-adfit-injected", "1");
  document.head.appendChild(script);
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface AdFitBannerProps {
  /**
   * 카카오 애드핏 광고 단위 ID
   * 애드핏 승인 후 대시보드에서 발급 — 형식: "DAN-xxxxxxxxxx"
   *
   * ★ 광고 코드 삽입 위치 ★
   * 실제 사용 예:
   *   <AdFitBanner adUnit="DAN-xxxxxxxxxx" />
   */
  adUnit: string;
  /** 데스크탑(≥768px) 광고 크기 (기본: 728x90) */
  desktopSize?: AdSize;
  /** 모바일(<768px) 광고 크기 (기본: 320x50) */
  mobileSize?: AdSize;
  style?: React.CSSProperties;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export default function AdFitBanner({
  adUnit,
  desktopSize = "728x90",
  mobileSize  = "320x50",
  style,
}: AdFitBannerProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const injectedRef   = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [visible,  setVisible]  = useState(false); // IntersectionObserver 진입 여부

  // ── 반응형: 모바일/데스크탑 감지 ───────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Lazy loading: 뷰포트 200px 앞에서 광고 로드 시작 ─────────────────────
  useEffect(() => {
    if (!ADFIT_ENABLED) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── 광고 스크립트 삽입 (visible 진입 후 1회) ─────────────────────────────
  useEffect(() => {
    if (!visible || injectedRef.current) return;
    injectedRef.current = true;
    injectAdFitScript();
  }, [visible]);

  const size      = isMobile ? SIZE_MAP[mobileSize] : SIZE_MAP[desktopSize];
  const minHeight = size.height;

  // ── 광고 비활성 상태: 빈 영역으로 공간만 확보 (CLS 방지) ─────────────────
  if (!ADFIT_ENABLED) {
    return (
      <div
        aria-hidden="true"
        style={{
          minHeight,
          width: "100%",
          // 개발 환경 확인용 아웃라인 — 승인 후 제거 가능:
          // outline: "1px dashed var(--lib-border)",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight,
        width: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      {visible ? (
        /*
         * ★ 광고 단위 삽입 위치 ★
         * data-ad-unit 에 props 로 전달받은 단위 ID 가 주입됩니다.
         * 애드핏 스크립트(ba.min.js)가 이 <ins> 를 광고로 교체합니다.
         */
        <ins
          className="kakao_ad_area"
          style={{ display: "none" }}
          data-ad-unit={adUnit}
          data-ad-width={String(size.width)}
          data-ad-height={String(size.height)}
        />
      ) : (
        /* Skeleton placeholder — 광고 로드 전 레이아웃 안정화 */
        <div
          aria-hidden="true"
          style={{
            width: Math.min(size.width, 970),
            height: size.height,
            maxWidth: "100%",
            background: "var(--lib-bg-3)",
            borderRadius: 4,
            animation: "adfit-skeleton-pulse 1.8s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}
