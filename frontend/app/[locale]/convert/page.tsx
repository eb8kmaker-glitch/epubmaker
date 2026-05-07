import { getTranslations } from "next-intl/server";
import FileUpload from "@/app/components/FileUpload";
import AdBanner from "@/app/components/ads/AdBanner";

export default async function ConvertPage() {
  const t = await getTranslations("Convert");
  const tGuide = await getTranslations("docxGuide");

  const sidebarLabelStyle: React.CSSProperties = {
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "var(--lib-dust)",
    padding: "0 16px",
    marginBottom: 8,
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  };

  const navItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "8px 16px",
    fontSize: 13,
    color: "var(--lib-dusk)",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    lineHeight: 1.4,
    borderLeft: "2px solid transparent",
  };

  const dividerStyle: React.CSSProperties = {
    height: 1,
    background: "var(--lib-border)",
    margin: "8px 16px",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr 200px",
        minHeight: "calc(100vh - 60px)",
      }}
    >
      {/* ── Left sidebar ── */}
      <aside
        style={{
          background: "var(--lib-bg-2)",
          borderRight: "1px solid var(--lib-border)",
          padding: "20px 0",
          overflowY: "auto",
        }}
      >
        <p style={sidebarLabelStyle}>{tGuide("title")}</p>

        <nav>
          <div style={navItemStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden style={{ flexShrink: 0, color: "var(--lib-wood-light)" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {tGuide("heading1")}
          </div>
          <div style={navItemStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden style={{ flexShrink: 0, color: "var(--lib-wood-light)" }}>
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
            </svg>
            {tGuide("heading2")}
          </div>
          <div style={navItemStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden style={{ flexShrink: 0, color: "var(--lib-wood-light)" }}>
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            {tGuide("heading3")}
          </div>
        </nav>

        <div style={dividerStyle} />

        <p style={{ ...sidebarLabelStyle, marginTop: 12 }}>{tGuide("howTo")}</p>
        <p
          style={{
            padding: "0 16px",
            fontSize: 11,
            color: "var(--lib-dust)",
            lineHeight: 1.6,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}
        >
          {tGuide("path")}
        </p>
      </aside>

      {/* ── Editor main ── */}
      <main
        style={{
          background: "var(--lib-panel)",
          overflowY: "auto",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            background: "var(--lib-bg-2)",
            borderBottom: "1px solid var(--lib-border)",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {/* Toolbar decoration — visual affordance matching the editor aesthetic */}
          {["B", "I", "H1", "H2"].map((label, i) => (
            <button
              key={label}
              type="button"
              title={label}
              style={{
                width: 28,
                height: 28,
                borderRadius: 5,
                border: "none",
                background: "none",
                color: "var(--lib-dusk)",
                fontSize: i < 2 ? 14 : 11,
                fontWeight: i === 0 ? 700 : i === 1 ? 400 : 500,
                fontStyle: i === 1 ? "italic" : "normal",
                cursor: "default",
                fontFamily: i < 2 ? "var(--font-serif), Georgia, serif" : "var(--font-sans), system-ui, sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {label}
            </button>
          ))}
          <span style={{ width: 1, height: 18, background: "var(--lib-border)", margin: "0 4px" }} />
          {["TOC", "CSS"].map((label) => (
            <button
              key={label}
              type="button"
              title={label}
              style={{
                width: 36,
                height: 28,
                borderRadius: 5,
                border: "none",
                background: "none",
                color: "var(--lib-dusk)",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.05em",
                cursor: "default",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Editor body */}
        <div
          style={{
            padding: "36px 48px",
            maxWidth: 680,
            margin: "0 auto",
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
              fontSize: 12,
              color: "var(--lib-dust)",
              marginBottom: 28,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {t("subtitle")}
          </p>

          <FileUpload />

          {/* Ad — below conversion result area */}
          <div style={{ marginTop: 40, paddingBottom: 24 }}>
            <AdBanner adSlot="0987654321" style={{ minHeight: 90 }} />
          </div>
        </div>
      </main>

      {/* ── Right panel ── */}
      <aside
        style={{
          background: "var(--lib-bg-2)",
          borderLeft: "1px solid var(--lib-border)",
          padding: "20px 16px",
          overflowY: "auto",
        }}
      >
        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--lib-dust)",
            marginBottom: 12,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}
        >
          {tGuide("title")}
        </p>

        <p
          style={{
            fontSize: 12,
            color: "var(--lib-dusk)",
            lineHeight: 1.65,
            marginBottom: 16,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}
        >
          {tGuide("note")}
        </p>

        <div style={{ height: 1, background: "var(--lib-border)", margin: "16px 0" }} />

        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--lib-dust)",
            marginBottom: 10,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}
        >
          {tGuide("howTo")}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--lib-dusk)",
            lineHeight: 1.65,
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          {tGuide("path")}
        </p>
      </aside>
    </div>
  );
}
