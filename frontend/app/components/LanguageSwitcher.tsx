"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useTransition, useState, useRef, useEffect } from "react";

const languageNames: Record<string, string> = {
  en: "English",
  ko: "한국어",
  es: "Español",
  ja: "日本語",
  zh: "中文",
  pt: "Português",
  de: "Deutsch",
  fr: "Français",
};

function getLocaleFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const seg = window.location.pathname.split("/")[1];
  return seg && (routing.locales as readonly string[]).includes(seg) ? seg : null;
}

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [displayLocale, setDisplayLocale] = useState(() => getLocaleFromPath() ?? locale);

  useEffect(() => {
    setDisplayLocale(locale);
  }, [locale]);

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
    // Persist preference — next-intl middleware reads NEXT_LOCALE cookie for root-path detection
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    setDisplayLocale(newLocale);
    setIsOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-[6px] border border-[var(--lib-border)] bg-[var(--lib-panel)] px-3 py-2 text-sm font-medium text-[var(--lib-ink)] shadow-sm transition-all duration-200 ease-in-out hover:bg-[var(--lib-bg-3)]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t("ariaLabel")}
      >
        <span className="max-w-[7rem] truncate sm:max-w-none">
          {languageNames[displayLocale] ?? displayLocale}
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
          className="absolute right-0 top-full z-20 mt-1 max-h-64 w-44 overflow-auto rounded-[10px] border border-[var(--lib-border)] bg-[var(--lib-panel)] py-1 shadow-sm"
        >
          {routing.locales.map((loc) => (
            <li key={loc} role="option" aria-selected={loc === displayLocale}>
              <button
                type="button"
                onClick={() => selectLocale(loc)}
                disabled={isPending}
                className={`w-full px-3 py-2 text-left text-sm transition-all duration-200 disabled:opacity-50 ${
                  loc === displayLocale
                    ? "bg-[var(--lib-bg-2)] font-medium text-[var(--lib-wood-dim)]"
                    : "text-[var(--lib-ink)] hover:bg-[var(--lib-bg-3)]"
                }`}
              >
                {languageNames[loc] ?? loc}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
