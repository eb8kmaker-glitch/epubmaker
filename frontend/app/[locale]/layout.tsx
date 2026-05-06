import { hasLocale } from "next-intl";
import { getTranslations, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import SetHtmlLang from "@/app/components/SetHtmlLang";
import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/layout/Navbar";
import { createServerClient } from "@/lib/supabase";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations("common");
  const tHome = await getTranslations("Home");

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SetHtmlLang locale={locale} />
      <Navbar
        user={user ? { email: user.email ?? "" } : null}
        locale={locale}
        navFeatures={tHome("navFeatures")}
        siteName={t("siteName")}
      />
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
