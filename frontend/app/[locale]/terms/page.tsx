/**
 * 이용약관 (Terms of Service).
 * 공개 페이지, 인증 불필요.
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

const BASE_URL = "https://www.epubmaker.org";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `${BASE_URL}/${locale}/terms`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `${BASE_URL}/${l}/terms`])),
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Terms");

  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-sans">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-semibold text-[var(--content)]">
          {t("title")}
        </h1>

        <div className="space-y-8 text-sm text-[var(--content)]">
          <section>
            <h2 className="mb-2 text-lg font-medium text-[var(--content)]">
              {t("section1Title")}
            </h2>
            <p className="whitespace-pre-line text-[var(--content-muted)]">
              {t("section1Body")}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-[var(--content)]">
              {t("section2Title")}
            </h2>
            <p className="whitespace-pre-line text-[var(--content-muted)]">
              {t("section2Body")}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-[var(--content)]">
              {t("section3Title")}
            </h2>
            <p className="whitespace-pre-line text-[var(--content-muted)]">
              {t("section3Body")}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-medium text-[var(--content)]">
              {t("section4Title")}
            </h2>
            <p className="whitespace-pre-line text-[var(--content-muted)]">
              {t("section4Body")}
            </p>
          </section>
        </div>

        <p className="mt-10 text-xs text-[var(--content-muted)]">
          {t("lastUpdated")}
        </p>
      </main>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
