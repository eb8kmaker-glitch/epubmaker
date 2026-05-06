"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "@/app/actions/auth";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

interface Props {
  user: { email: string } | null;
  locale: string;
}

export default function UserMenu({ user, locale }: Props) {
  const t = useTranslations("UserMenu");
  const [isOpen, setIsOpen] = useState(false);
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

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/login"
          className="btn-ghost-gold"
          style={{
            display: "inline-block",
            padding: "7px 16px",
            fontSize: 13,
            letterSpacing: "0.05em",
            borderRadius: 2,
            textDecoration: "none",
            fontFamily: "var(--font-jost), sans-serif",
            background: "transparent",
          }}
        >
          {t("login")}
        </Link>
        <Link
          href="/signup"
          className="btn-gold"
          style={{
            display: "inline-block",
            padding: "7px 16px",
            fontSize: 13,
            letterSpacing: "0.05em",
            borderRadius: 2,
            textDecoration: "none",
            fontFamily: "var(--font-jost), sans-serif",
          }}
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
        className="btn-ghost-gold"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          fontSize: 13,
          borderRadius: 2,
          background: "transparent",
          cursor: "pointer",
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--gold)",
            color: "var(--deep-brown)",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <svg
          style={{ width: 14, height: 14, opacity: 0.6 }}
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
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            zIndex: 20,
            width: 200,
            overflow: "hidden",
            borderRadius: 3,
            border: "1px solid rgba(214,185,123,0.2)",
            background: "var(--panel)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid rgba(214,185,123,0.12)",
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--cream-dim)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                opacity: 0.7,
              }}
            >
              {user.email}
            </p>
          </div>

          {(
            [
              { href: "/dashboard", label: t("dashboard") },
              { href: "/account", label: t("account") },
              { href: "/subscription", label: t("manageSubscription") },
            ] as const
          ).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "9px 12px",
                fontSize: 13,
                color: "var(--cream-dim)",
                textDecoration: "none",
                transition: "background 0.2s ease, color 0.2s ease",
              }}
              className="nav-link"
              role="menuitem"
            >
              {item.label}
            </Link>
          ))}

          {ADMIN_EMAIL && user.email === ADMIN_EMAIL && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "9px 12px",
                fontSize: 13,
                color: "var(--gold)",
                textDecoration: "none",
                fontWeight: 500,
              }}
              role="menuitem"
            >
              {t("admin")}
            </Link>
          )}

          <div style={{ borderTop: "1px solid rgba(214,185,123,0.12)", paddingTop: 4, marginTop: 4 }}>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setIsOpen(false);
                startTransition(() => signOut(locale));
              }}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                color: "#ef4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s ease",
                opacity: isPending ? 0.5 : 1,
              }}
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
