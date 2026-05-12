import ConvertFlow from "@/app/components/convert/ConvertFlow";
import AdBanner from "@/app/components/ads/AdBanner";

export default function ConvertPage() {
  return (
    <div style={{ background: "var(--lib-panel)", minHeight: "calc(100vh - 60px)" }}>
      <ConvertFlow />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 28px 56px", width: "100%" }}>
        <AdBanner adSlot="0987654321" style={{ minHeight: 90 }} />
      </div>
    </div>
  );
}
