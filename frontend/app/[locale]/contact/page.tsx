import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import ContactForm from "@/app/components/ContactForm";

const BASE_URL = "https://www.epubmaker.org";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return {
    title: t("title"),
    alternates: {
      canonical: `${BASE_URL}/${locale}/contact`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `${BASE_URL}/${l}/contact`])),
    },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Contact");

  return (
    <div style={{ minHeight: "100vh", background: "var(--lib-bg)" }}>
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 26,
            fontWeight: 500,
            color: "var(--lib-ink)",
            marginBottom: 10,
          }}
        >
          {t("title")}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--lib-dust)",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            marginBottom: 36,
            lineHeight: 1.7,
          }}
        >
          {t("description")}
        </p>

        <ContactForm />
      </main>
    </div>
  );
}

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
