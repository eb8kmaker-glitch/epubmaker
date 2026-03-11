"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useTransition, useState, useRef, useEffect } from "react";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
  es: "Español",
  ja: "日本語",
  zh: "中文",
  pt: "Português",
  de: "Deutsch",
  fr: "Français",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common.languages");
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectLocale(newLocale: string) {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
      setIsOpen(false);
    });
  }

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <span className="max-w-[7rem] truncate sm:max-w-none">
          {(t(locale) || LOCALE_LABELS[locale]) ?? locale}
        </span>
        <svg
          className="h-4 w-4 shrink-0 opacity-70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-20 mt-1 max-h-64 w-44 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
        >
          {routing.locales.map((loc) => (
            <li key={loc} role="option" aria-selected={loc === locale}>
              <button
                type="button"
                onClick={() => selectLocale(loc)}
                disabled={isPending}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 ${
                  loc === locale
                    ? "bg-emerald-50 font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                    : "text-zinc-700 dark:text-zinc-200"
                }`}
              >
                {(t(loc) || LOCALE_LABELS[loc]) ?? loc}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
