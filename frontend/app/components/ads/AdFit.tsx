"use client";

/**
 * AdFit — 카카오 애드핏 범용 광고 컴포넌트
 *
 * 사용법:
 *   <AdFit adUnit="DAN-wIRxEO1tx9SUVgKz" width={300} height={250} />
 *
 * 활성화:
 *   .env.local 에 NEXT_PUBLIC_ADFIT_ENABLED=true 추가
 *
 * 비활성 시: min-height 만 유지 (CLS 방지)
 */

import { useEffect, useRef, useState } from "react";

const SCRIPT_SRC = "//t1.kakaocdn.net/kas/static/ba.min.js";
const ADFIT_ENABLED = process.env.NEXT_PUBLIC_ADFIT_ENABLED === "true";

/** 페이지당 1회만 스크립트 삽입 (중복 방지) */
function ensureAdFitScript() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
  const s = document.createElement("script");
  s.src = SCRIPT_SRC;
  s.async = true;
  document.head.appendChild(s);
}

export interface AdFitProps {
  /** 카카오 애드핏 광고 단위 ID (예: "DAN-wIRxEO1tx9SUVgKz") */
  adUnit: string;
  /** 광고 너비 (px) */
  width: number;
  /** 광고 높이 (px) */
  height: number;
  style?: React.CSSProperties;
}

export default function AdFit({ adUnit, width, height, style }: AdFitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);   // hydration 안전
  const [visible, setVisible] = useState(false);   // lazy loading
  const scriptInjected = useRef(false);

  // hydration 완료 후 클라이언트 렌더링 시작
  useEffect(() => {
    setMounted(true);
  }, []);

  // IntersectionObserver: 뷰포트 200px 앞에서 광고 로드
  useEffect(() => {
    if (!mounted || !ADFIT_ENABLED) return;
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
  }, [mounted]);

  // visible 진입 후 스크립트 1회 삽입
  useEffect(() => {
    if (!visible || scriptInjected.current) return;
    scriptInjected.current = true;
    ensureAdFitScript();
  }, [visible]);

  // 광고 비활성 시: 공간만 확보
  if (!ADFIT_ENABLED) {
    return (
      <div
        aria-hidden="true"
        style={{ minHeight: height, width: "100%", ...style }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        justifyContent: "center",
        minHeight: height,
        width: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* 마운트 전: SSR/hydration 안전 */}
      {!mounted ? (
        <div aria-hidden="true" style={{ width, height, maxWidth: "100%" }} />
      ) : visible ? (
        /* 광고 단위 — 애드핏 스크립트가 <ins>를 광고로 교체 */
        <ins
          className="kakao_ad_area"
          style={{ display: "none" }}
          data-ad-unit={adUnit}
          data-ad-width={String(width)}
          data-ad-height={String(height)}
        />
      ) : (
        /* 스켈레톤 플레이스홀더 — 광고 로드 전 레이아웃 안정화 */
        <div
          aria-hidden="true"
          style={{
            width,
            height,
            maxWidth: "100%",
            background: "var(--lib-bg-3)",
            borderRadius: 4,
          }}
        />
      )}
    </div>
  );
}
