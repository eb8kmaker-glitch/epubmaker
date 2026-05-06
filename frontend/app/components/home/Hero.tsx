import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Hero() {
  const t = await getTranslations("Home");

  return (
    <section
      style={{
        position: "relative",
        minHeight: 580,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "80px 24px 100px",
      }}
    >
      {/* Warm glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(214,185,123,0.12), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Bookshelf arch SVG decoration */}
      <svg
        viewBox="0 0 1200 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.1,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <path d="M 0,500 C 0,80 1200,80 1200,500" stroke="#D6B97B" strokeWidth="1.5" />
        <path d="M 70,500 C 70,145 1130,145 1130,500" stroke="#D6B97B" strokeWidth="1" />
        <line x1="138" y1="390" x2="1062" y2="390" stroke="#D6B97B" strokeWidth="0.8" />
        <line x1="265" y1="270" x2="935" y2="270" stroke="#D6B97B" strokeWidth="0.8" />
        <line x1="210" y1="500" x2="210" y2="390" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="340" y1="500" x2="340" y2="390" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="470" y1="500" x2="470" y2="390" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="600" y1="500" x2="600" y2="390" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="730" y1="500" x2="730" y2="390" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="860" y1="500" x2="860" y2="390" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="990" y1="500" x2="990" y2="390" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="340" y1="390" x2="340" y2="270" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="470" y1="390" x2="470" y2="270" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="600" y1="390" x2="600" y2="270" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="730" y1="390" x2="730" y2="270" stroke="#D6B97B" strokeWidth="0.6" />
        <line x1="860" y1="390" x2="860" y2="270" stroke="#D6B97B" strokeWidth="0.6" />
        <circle cx="600" cy="200" r="4" fill="#D6B97B" />
        <circle cx="600" cy="200" r="7" stroke="#D6B97B" strokeWidth="0.5" />
      </svg>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: 680,
          gap: 0,
        }}
      >
        {/* Tagline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <span style={{ width: 40, height: 1, background: "var(--gold)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--gold)",
              fontFamily: "var(--font-jost), sans-serif",
              fontWeight: 400,
            }}
          >
            {t("heroTagline")}
          </span>
          <span style={{ width: 40, height: 1, background: "var(--gold)", flexShrink: 0 }} />
        </div>

        {/* H1 */}
        <h1
          style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: "clamp(42px, 7vw, 72px)",
            fontWeight: 500,
            lineHeight: 1.1,
            color: "var(--cream)",
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          {t("hero.titlePlain")}
        </h1>
        <h1
          style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: "clamp(42px, 7vw, 72px)",
            fontWeight: 500,
            lineHeight: 1.15,
            color: "var(--gold)",
            fontStyle: "italic",
            marginBottom: 28,
            letterSpacing: "-0.01em",
          }}
        >
          {t("hero.titleEm")}
        </h1>

        {/* Body */}
        <p
          style={{
            fontSize: 16,
            fontWeight: 300,
            color: "var(--cream-dim)",
            maxWidth: 480,
            marginBottom: 44,
            lineHeight: 1.75,
            letterSpacing: "0.01em",
          }}
        >
          {t("hero.subtitle")}
        </p>

        {/* CTA */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/convert"
            className="btn-gold"
            style={{
              display: "inline-block",
              padding: "14px 40px",
              fontSize: 14,
              letterSpacing: "0.06em",
              borderRadius: 2,
              textDecoration: "none",
              fontFamily: "var(--font-jost), sans-serif",
            }}
          >
            {t("hero.cta")}
          </Link>
          <a
            href="#features"
            className="btn-ghost-gold"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              fontSize: 14,
              letterSpacing: "0.05em",
              borderRadius: 2,
              textDecoration: "none",
              fontFamily: "var(--font-jost), sans-serif",
              background: "transparent",
            }}
          >
            {t("hero.ctaSecondary")}
          </a>
        </div>

        {/* Free badge */}
        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "var(--cream-dim)",
            opacity: 0.5,
            letterSpacing: "0.08em",
            fontFamily: "var(--font-jost), sans-serif",
          }}
        >
          {t("hero.freeBadge")}
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          className="scroll-line"
          style={{
            width: 1,
            height: 48,
            background: "linear-gradient(180deg, transparent, var(--gold))",
          }}
        />
      </div>
    </section>
  );
}
