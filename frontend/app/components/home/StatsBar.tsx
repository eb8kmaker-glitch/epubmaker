import { getTranslations } from "next-intl/server";

export default async function StatsBar() {
  const t = await getTranslations("Home");

  const stats = [
    { value: "48K+", labelKey: "statsConversions" as const },
    { value: "8", labelKey: "statsLanguages" as const },
    { value: "99.9%", labelKey: "statsUptime" as const },
    { value: "4.9★", labelKey: "statsRating" as const },
  ];

  return (
    <div
      style={{
        borderTop: "1px solid rgba(214,185,123,0.1)",
        borderBottom: "1px solid rgba(214,185,123,0.1)",
        background: "rgba(43,30,23,0.4)",
        padding: "0",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={stat.labelKey}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 16px",
              borderRight:
                i < stats.length - 1
                  ? "1px solid rgba(214,185,123,0.1)"
                  : undefined,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: 42,
                fontWeight: 500,
                color: "var(--gold)",
                lineHeight: 1,
              }}
            >
              {stat.value}
            </span>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--cream-dim)",
                marginTop: 6,
                fontFamily: "var(--font-jost), sans-serif",
              }}
            >
              {t(stat.labelKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
