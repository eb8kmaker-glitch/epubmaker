"use client";

/**
 * ConvertSideAd — Convert 페이지 에디터 좌측 세로 광고
 *
 * - 1400px 이상 데스크탑에서만 노출 (CSS 클래스 .convert-side-ad 제어)
 * - BookEditor의 <style> 블록에서 미디어쿼리를 관리합니다.
 * - 광고 단위: DAN-nMMRxIpL9T2O1OW4 (160x600)
 */

import AdFit from "@/app/components/ads/AdFit";

export default function ConvertSideAd() {
  return (
    <div className="convert-side-ad" aria-label="광고 영역">
      {/* sticky: 에디터 상단에서 고정, 화면 하단 넘침 방지 */}
      <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--lib-dust)",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            opacity: 0.5,
            userSelect: "none",
          }}
        >
          광고
        </span>
        <AdFit
          adUnit="DAN-nMMRxIpL9T2O1OW4"
          width={160}
          height={600}
        />
      </div>
    </div>
  );
}
