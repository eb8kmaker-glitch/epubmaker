import { getTranslations } from "next-intl/server";

const ICONS: Record<string, React.ReactNode> = {
  docxTxt: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  toc: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  cover: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  css: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  metadata: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  ),
};

export default async function FeatureCards() {
  const t = await getTranslations("Home");

  const features = [
    { key: "docxTxt" as const, iconKey: "docxTxt" },
    { key: "toc" as const, iconKey: "toc" },
    { key: "cover" as const, iconKey: "cover" },
    { key: "css" as const, iconKey: "css" },
    { key: "metadata" as const, iconKey: "metadata" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 20,
      }}
    >
      {features.map((f) => (
        <div
          key={f.key}
          className="feature-card"
          style={{
            background: "linear-gradient(145deg, #332219, #2B1C13)",
            border: "1px solid rgba(214,185,123,0.12)",
            borderRadius: 3,
            padding: "28px 24px",
          }}
        >
          {/* Icon box */}
          <div
            style={{
              width: 44,
              height: 44,
              border: "1px solid rgba(214,185,123,0.25)",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold)",
              marginBottom: 16,
            }}
          >
            {ICONS[f.iconKey]}
          </div>

          <h3
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--cream)",
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            {t(`features.${f.key}`)}
          </h3>

          <p
            style={{
              fontSize: 14,
              fontWeight: 300,
              color: "var(--cream-dim)",
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            {t(`features.${f.key}Desc`)}
          </p>

          <span
            className="fc-learn"
            style={{
              fontSize: 13,
              color: "rgba(214,185,123,0.5)",
              transition: "color 0.25s ease",
              cursor: "default",
            }}
          >
            {t("featureLearnMore")} →
          </span>
        </div>
      ))}
    </div>
  );
}
