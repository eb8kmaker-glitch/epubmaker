import ConvertFlow from "@/app/components/convert/ConvertFlow";
import AdFitBanner from "@/app/components/ads/AdFitBanner";

export default function ConvertPage() {
  return (
    <div style={{ background: "var(--lib-panel)", minHeight: "calc(100vh - 60px)" }}>
      <ConvertFlow />
      {/*
       * ── Ad: 변환 결과 영역 위 ──────────────────────────────────────────────
       * ConvertFlow 가 EditorLayout 오버레이(fixed)를 띄우는 동안에는
       * 이 영역이 가려지므로 업로드/설정 단계에서만 사용자에게 노출됩니다.
       * adUnit: 애드핏 승인 후 "DAN-xxxxxxxxxx" 형식의 단위 ID 로 교체
       * ─────────────────────────────────────────────────────────────────────
       */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 28px 56px", width: "100%" }}>
        <AdFitBanner
          adUnit="DAN-mQe45jKz1SS2Zpe7"
          desktopSize="728x90"
          mobileSize="300x250"
        />
      </div>
    </div>
  );
}
