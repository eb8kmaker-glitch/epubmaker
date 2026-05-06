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

const ghostStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 16px",
  fontSize: 13,
  borderRadius: 6,
  textDecoration: "none",
  fontFamily: "var(--font-sans), system-ui, sans-serif",
  border: "1px solid var(--lib-border-2)",
  color: "var(--lib-dusk)",
  background: "transparent",
  cursor: "pointer",
  transition: "all 200ms ease",
};

const fillStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 16px",
  fontSize: 13,
  borderRadius: 6,
  textDecoration: "none",
  fontFamily: "var(--font-sans), system-ui, sans-serif",
  background: "var(--lib-wood-dim)",
  color: "#F8F5F0",
  border: "none",
  cursor: "pointer",
  transition: "all 200ms ease",
};

export default function UserMenu({ user, locale }: Props) {
  const t = useTranslations("UserMenu");
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

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Link href="/login" style={ghostStyle} className="btn-ghost">
          {t("login")}
        </Link>
        <Link href="/signup" style={fillStyle} className="btn-primary">
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
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 10px 5px 5px",
          fontSize: 13,
          borderRadius: 6,
          background: "transparent",
          border: "1px solid var(--lib-border)",
          cursor: "pointer",
          color: "var(--lib-dusk)",
          transition: "all 200ms ease",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
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
            background: "var(--lib-wood-dim)",
            color: "#F8F5F0",
            fontSize: 10,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <svg
          style={{ width: 12, height: 12, opacity: 0.5 }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
            width: 192,
            overflow: "hidden",
            borderRadius: 8,
            border: "1px solid var(--lib-border)",
            background: "var(--lib-panel)",
            boxShadow: "0 8px 24px rgba(44,36,32,0.12)",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid var(--lib-border)",
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--lib-dust)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </p>
          </div>

          {(
            [
              { href: "/dashboard", label: t("dashboard") },
              { href: "/account", label: t("account") },
            ] as const
          ).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--lib-dusk)",
                textDecoration: "none",
                transition: "background 150ms ease, color 150ms ease",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
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
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--lib-wood-dim)",
                textDecoration: "none",
                fontWeight: 500,
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
              role="menuitem"
            >
              {t("admin")}
            </Link>
          )}

          <div style={{ borderTop: "1px solid var(--lib-border)", paddingTop: 4, marginTop: 4 }}>
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
                padding: "8px 12px",
                fontSize: 13,
                color: "#b91c1c",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "background 150ms ease",
                opacity: isPending ? 0.5 : 1,
                fontFamily: "var(--font-sans), system-ui, sans-serif",
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
