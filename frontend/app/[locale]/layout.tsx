import { hasLocale } from "next-intl";
import { getTranslations, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import SetHtmlLang from "@/app/components/SetHtmlLang";
import UserMenu from "@/app/components/UserMenu";
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

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SetHtmlLang locale={locale} />
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 backdrop-blur transition-all duration-200 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--content)] transition-colors duration-200 hover:text-[var(--primary)]"
          >
            {t("siteName")}
          </Link>
          <div className="flex items-center gap-2">
            <UserMenu
              user={user ? { email: user.email ?? "" } : null}
              locale={locale}
            />
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      {children}
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
