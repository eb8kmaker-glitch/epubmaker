"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "@/app/actions/auth";

interface Props {
  user: { email: string } | null;
  locale: string;
}

export default function UserMenu({ user, locale }: Props) {
  const t = useTranslations("UserMenu");
  const [isOpen, setIsOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleManageSubscription() {
    setIsOpen(false);
    setPortalLoading(true);
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/login"
          className="rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--content)] shadow-sm transition-all duration-200 ease-in-out hover:bg-[var(--dropzone-hover)]"
        >
          {t("login")}
        </Link>
        <Link
          href="/signup"
          className="hidden rounded-[10px] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-in-out hover:opacity-90 sm:inline-flex"
        >
          {t("signUp")}
        </Link>
      </div>
    );
  }

  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--content)] shadow-sm transition-all duration-200 ease-in-out hover:bg-[var(--dropzone-hover)]"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-white">
          {initials}
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
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--card)] py-1 shadow-[var(--shadow-card)]"
        >
          <div className="border-b border-[var(--border)] px-3 py-2.5">
            <p className="truncate text-xs text-[var(--content-muted)]">
              {user.email}
            </p>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center px-3 py-2 text-sm text-[var(--content)] transition-colors hover:bg-[var(--dropzone-hover)]"
            role="menuitem"
          >
            {t("dashboard")}
          </Link>

          <Link
            href="/account"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center px-3 py-2 text-sm text-[var(--content)] transition-colors hover:bg-[var(--dropzone-hover)]"
            role="menuitem"
          >
            {t("account")}
          </Link>

          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="flex w-full items-center px-3 py-2 text-sm text-[var(--content)] transition-colors hover:bg-[var(--dropzone-hover)] disabled:opacity-50"
            role="menuitem"
          >
            {t("manageSubscription")}
          </button>

          <div className="mt-1 border-t border-[var(--border)] pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setIsOpen(false);
                startTransition(() => signOut(locale));
              }}
              className="flex w-full items-center px-3 py-2 text-sm text-red-500 transition-colors hover:bg-[var(--dropzone-hover)] disabled:opacity-50"
              role="menuitem"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
