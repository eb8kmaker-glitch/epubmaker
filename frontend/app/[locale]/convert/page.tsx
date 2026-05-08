import { getTranslations } from "next-intl/server";
import ConvertFlow from "@/app/components/convert/ConvertFlow";
import AdBanner from "@/app/components/ads/AdBanner";

export default async function ConvertPage() {
  const t = await getTranslations("Convert");

  return (
    <div style={{ background: "var(--lib-panel)", minHeight: "calc(100vh - 60px)" }}>
      {/* Decorative editor toolbar */}
      <div
        style={{
          borderBottom: "1px solid var(--lib-border)",
          padding: "8px 20px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "var(--lib-bg-2)",
        }}
      >
        {(["B", "I", "H1", "H2"] as const).map((label, i) => (
          <span
            key={label}
            style={{
              width: 28,
              height: 28,
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--lib-border-2)",
              fontSize: i < 2 ? 14 : 11,
              fontWeight: i === 0 ? 700 : i === 1 ? 400 : 500,
              fontStyle: i === 1 ? "italic" : "normal",
              fontFamily: i < 2 ? "var(--font-serif), Georgia, serif" : "var(--font-sans), system-ui, sans-serif",
              userSelect: "none",
              pointerEvents: "none",
            }}
            aria-hidden
          >
            {label}
          </span>
        ))}
        <span style={{ width: 1, height: 16, background: "var(--lib-border)", margin: "0 4px" }} aria-hidden />
        {(["TOC", "CSS"] as const).map((label) => (
          <span
            key={label}
            style={{
              width: 36,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--lib-border-2)",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.05em",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              userSelect: "none",
              pointerEvents: "none",
            }}
            aria-hidden
          >
            {label}
          </span>
        ))}
      </div>

      {/* Centered editor area */}
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "40px 24px 60px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 26,
            fontWeight: 500,
            color: "var(--lib-ink)",
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}
        >
          {t("title")}
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--lib-dust)",
            marginBottom: 32,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}
        >
          {t("subtitle")}
        </p>

        <ConvertFlow />

        <div style={{ marginTop: 48 }}>
          <AdBanner adSlot="0987654321" style={{ minHeight: 90 }} />
        </div>
      </div>
    </div>
  );
}
