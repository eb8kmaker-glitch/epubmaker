import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Hero() {
  const t = await getTranslations("Home");

  return (
    <>
      <section
        style={{
          position: "relative",
          padding: "72px 36px 80px",
          textAlign: "center",
          background: "var(--lib-bg)",
          borderBottom: "1px solid var(--lib-border)",
          overflow: "hidden",
        }}
      >
        {/* Kicker */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--lib-gold)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--lib-dust)",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {t("heroTagline")}
          </span>
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--lib-gold)",
              flexShrink: 0,
            }}
          />
        </div>

        {/* H1 */}
        <h1
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "clamp(32px, 5vw, 46px)",
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: "var(--lib-ink)",
            marginBottom: 16,
          }}
        >
          {t("hero.titlePlain")}{" "}
          <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>
            {t("hero.titleEm")}
          </em>
        </h1>

        {/* Body */}
        <p
          style={{
            fontSize: 16,
            fontWeight: 300,
            color: "var(--lib-dusk)",
            maxWidth: 440,
            margin: "0 auto 36px",
            lineHeight: 1.75,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}
        >
          {t("hero.subtitle")}
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Link
            href="/convert"
            style={{
              display: "inline-block",
              padding: "11px 28px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 7,
              textDecoration: "none",
              background: "var(--lib-wood-dim)",
              color: "#F8F5F0",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              transition: "all 200ms ease",
            }}
            className="btn-primary"
          >
            {t("hero.cta")}
          </Link>
          <a
            href="#features"
            style={{
              display: "inline-block",
              padding: "11px 28px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 7,
              textDecoration: "none",
              border: "1px solid var(--lib-border-2)",
              color: "var(--lib-dusk)",
              background: "transparent",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              transition: "all 200ms ease",
            }}
            className="btn-ghost"
          >
            {t("hero.ctaSecondary")}
          </a>
        </div>

        {/* Meta */}
        <p
          style={{
            fontSize: 12,
            color: "var(--lib-dust)",
            letterSpacing: "0.03em",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}
        >
          {t("hero.freeBadge")}
        </p>
      </section>

      {/* Sunlight accent line */}
      <div
        style={{
          height: 3,
          background:
            "linear-gradient(90deg, transparent, #E8C98A 30%, #F0D9A0 50%, #E8C98A 70%, transparent)",
          opacity: 0.5,
        }}
      />
    </>
  );
}
