import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const t = await getTranslations("common");

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)]/95 px-4 py-3 backdrop-blur transition-all duration-200 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--content)] transition-colors duration-200 hover:text-[var(--primary)]"
          >
            {t("siteName")}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>
      {children}
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
