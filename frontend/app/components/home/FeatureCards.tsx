import { getTranslations } from "next-intl/server";

const ICONS: Record<string, React.ReactNode> = {
  docxTxt: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  toc: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  cover: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  css: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  metadata: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  ),
};

export default async function FeatureCards({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home" });

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
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
    >
      {features.map((f) => (
        <div
          key={f.key}
          className="feature-card"
          style={{
            background: "var(--lib-panel)",
            border: "1px solid var(--lib-border)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          {/* Icon box */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--lib-bg-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--lib-wood)",
              marginBottom: 14,
            }}
          >
            {ICONS[f.iconKey]}
          </div>

          <h3
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: 16,
              fontWeight: 500,
              color: "var(--lib-ink)",
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            {t(`features.${f.key}`)}
          </h3>

          <p
            style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 300,
              color: "var(--lib-dusk)",
              lineHeight: 1.65,
            }}
          >
            {t(`features.${f.key}Desc`)}
          </p>
        </div>
      ))}
    </div>
  );
}
