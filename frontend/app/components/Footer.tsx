"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--card)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm">
          <Link
            href="/terms"
            className="text-[var(--content-muted)] transition-colors hover:text-[var(--content)]"
          >
            {t("terms")}
          </Link>
          <Link
            href="/privacy"
            className="text-[var(--content-muted)] transition-colors hover:text-[var(--content)]"
          >
            {t("privacy")}
          </Link>
          <Link
            href="/refund"
            className="text-[var(--content-muted)] transition-colors hover:text-[var(--content)]"
          >
            {t("refund")}
          </Link>
        </nav>
        <p className="text-xs text-[var(--content-muted)]">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
