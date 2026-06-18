import { Link } from "@/i18n/navigation";
import { FAQJsonLd } from "@/app/components/content/JsonLd";

/**
 * ConversionLanding — shared presentation for the format-specific SEO landing
 * pages (DOC → EPUB, TXT → EPUB). Each route injects format-specific copy via
 * `data`; the layout, styling, and JSON-LD wiring stay in one place to avoid
 * duplication between the two pages.
 *
 * The conversion UI (ConvertFlow) takes no input-format prop, so these pages do
 * not embed it — they link out to /convert via the CTAs instead.
 */

export type ConversionLandingData = {
  /** Small uppercase label above the H1, e.g. "Free EPUB Conversion · DOC → EPUB" */
  eyebrow: string;
  /** Exact confirmed H1 copy */
  h1: string;
  /** Exact confirmed subhead / differentiation copy */
  subhead: string;
  /** Primary CTA button label */
  ctaLabel: string;
  /** Heading above the steps section */
  stepsHeading: string;
  /** schema.org HowTo name */
  howToName: string;
  /** Ordered list of confirmed step sentences (How-to) */
  steps: string[];
  /** Heading above the FAQ section */
  faqHeading: string;
  /** Confirmed FAQ items */
  faq: { q: string; a: string }[];
  /** Heading above the related-links section */
  relatedHeading: string;
  /** Internal links (other landing page + /convert) */
  related: { href: string; label: string }[];
  /** Closing CTA lead-in line */
  finalCtaText: string;
};

const ctaStyle = {
  display: "inline-block",
  padding: "13px 32px",
  fontSize: 15,
  fontWeight: 500,
  borderRadius: 7,
  textDecoration: "none",
  background: "var(--lib-wood-dim)",
  color: "#F8F5F0",
} as const;

export default function ConversionLanding({ data }: { data: ConversionLandingData }) {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.howToName,
    step: data.steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `Step ${i + 1}`,
      text,
    })),
  };

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "64px 36px 80px",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        color: "var(--lib-ink)",
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <FAQJsonLd items={data.faq.map(({ q, a }) => ({ question: q, answer: a }))} />

      <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16 }}>
        {data.eyebrow}
      </p>

      <h1
        style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 500,
          lineHeight: 1.25,
          marginBottom: 20,
          color: "var(--lib-ink)",
        }}
      >
        {data.h1}
      </h1>

      <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 36 }}>
        {data.subhead}
      </p>

      <div style={{ marginBottom: 48 }}>
        <Link href="/convert" style={ctaStyle}>
          {data.ctaLabel}
        </Link>
      </div>

      {/* Steps (How to) */}
      <section style={{ marginBottom: 48 }}>
        <h2
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--lib-ink)",
            marginBottom: 24,
            marginTop: 0,
          }}
        >
          {data.stepsHeading}
        </h2>
        {data.steps.map((text, i) => (
          <div key={i} style={{ display: "flex", gap: 24, marginBottom: 28 }}>
            <span
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: 40,
                fontWeight: 500,
                color: "var(--lib-border-2)",
                lineHeight: 1,
                flexShrink: 0,
                minWidth: 52,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <p style={{ fontSize: 15, color: "var(--lib-dusk)", lineHeight: 1.75, margin: 0, alignSelf: "center" }}>
              {text}
            </p>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: 48 }}>
        <h2
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--lib-ink)",
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          {data.faqHeading}
        </h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.faq.map(({ q, a }, i) => (
            <div
              key={i}
              style={{
                padding: "24px 0",
                borderBottom: i < data.faq.length - 1 ? "1px solid var(--lib-border)" : undefined,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--lib-ink)",
                  margin: "0 0 8px",
                }}
              >
                {q}
              </h3>
              <p style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.75, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related links */}
      <section style={{ marginBottom: 48 }}>
        <h2
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--lib-ink)",
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          {data.relatedHeading}
        </h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {data.related.map(({ href, label }) => (
            <li key={href} style={{ fontSize: 15, lineHeight: 1.9 }}>
              <Link href={href} style={{ color: "var(--lib-wood)", textDecoration: "underline" }}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing CTA */}
      <div style={{ textAlign: "center", padding: "40px 0 0" }}>
        <p style={{ fontSize: 16, color: "var(--lib-dusk)", marginBottom: 20 }}>{data.finalCtaText}</p>
        <Link href="/convert" style={ctaStyle}>
          {data.ctaLabel}
        </Link>
      </div>
    </main>
  );
}
