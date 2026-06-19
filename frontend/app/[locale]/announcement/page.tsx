import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export default async function AnnouncementPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Announcement");

  const faqItems = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--lib-bg)", padding: "64px 36px 96px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Badge */}
        <div style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: 4,
          background: "var(--lib-bg-3)",
          border: "1px solid var(--lib-border-2)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--lib-gold)",
          marginBottom: 24,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}>
          {t("badge")}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: "clamp(26px, 4vw, 40px)",
          fontWeight: 500,
          color: "var(--lib-ink)",
          lineHeight: 1.2,
          marginBottom: 20,
        }}>
          {t("title")}
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 16,
          fontWeight: 300,
          color: "var(--lib-dusk)",
          lineHeight: 1.75,
          marginBottom: 40,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}>
          {t("subtitle")}
        </p>

        {/* Key message */}
        <div style={{
          borderRadius: 6,
          border: "1px solid var(--lib-border-2)",
          background: "var(--lib-bg-2)",
          padding: "20px 24px",
          marginBottom: 40,
        }}>
          <p style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 18,
            fontWeight: 500,
            color: "var(--lib-ink)",
            lineHeight: 1.5,
            margin: 0,
          }}>
            {t("keyMessage")}
          </p>
        </div>

        {/* What changed section */}
        <h2 style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: 22,
          fontWeight: 500,
          color: "var(--lib-ink)",
          marginBottom: 16,
        }}>
          {t("whatChangedTitle")}
        </h2>

        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px", display: "flex", flexDirection: "column", gap: 12 }}>
          {([1, 2, 3, 4] as const).map((i) => (
            <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{
                flexShrink: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "var(--lib-wood-dim)",
                color: "#F8F5F0",
                fontSize: 11,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
              }}>✓</span>
              <span style={{
                fontSize: 14,
                color: "var(--lib-dusk)",
                lineHeight: 1.6,
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}>
                {t(`change${i}` as `change${typeof i}`)}
              </span>
            </li>
          ))}
        </ul>

        {/* Data notice */}
        <div style={{
          borderRadius: 6,
          border: "1px solid var(--lib-border)",
          background: "var(--lib-bg-2)",
          padding: "16px 20px",
          marginBottom: 40,
        }}>
          <h3 style={{
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--lib-ink)",
            marginBottom: 8,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}>
            {t("dataNoticeTitle")}
          </h3>
          <p style={{
            fontSize: 13,
            color: "var(--lib-dusk)",
            lineHeight: 1.65,
            margin: 0,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}>
            {t("dataNoticeBody")}
          </p>
        </div>

        {/* FAQ */}
        <h2 style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: 22,
          fontWeight: 500,
          color: "var(--lib-ink)",
          marginBottom: 20,
        }}>
          {t("faqTitle")}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
          {faqItems.map((item, i) => (
            <div key={i} style={{
              borderRadius: 6,
              border: "1px solid var(--lib-border)",
              background: "var(--lib-bg-2)",
              padding: "16px 20px",
            }}>
              <p style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--lib-ink)",
                marginBottom: 8,
              }}>
                {item.q}
              </p>
              <p style={{
                fontSize: 13,
                color: "var(--lib-dusk)",
                lineHeight: 1.65,
                margin: 0,
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Link
            href="/convert"
            className="btn-primary"
            style={{
              display: "inline-block",
              padding: "13px 32px",
              fontSize: 15,
              fontWeight: 500,
              borderRadius: 7,
              textDecoration: "none",
              background: "var(--lib-wood-dim)",
              color: "#F8F5F0",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
