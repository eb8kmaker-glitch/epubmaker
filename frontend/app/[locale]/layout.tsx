import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import SetHtmlLang from "@/app/components/SetHtmlLang";
import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/layout/Navbar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const BASE_URL = "https://epubmaker.org";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${BASE_URL}/${loc}`;
  }
  languages["x-default"] = `${BASE_URL}/en`;

  return {
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages,
    },
    openGraph: {
      locale,
      siteName: `EPUBMaker — ${t("siteName")}`,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SetHtmlLang locale={locale} />
      <Navbar locale={locale} />
      <div className="flex min-h-screen flex-col">
        {children}
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
