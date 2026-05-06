"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        marginTop: "auto",
        background: "var(--lib-bg-2)",
        borderTop: "1px solid var(--lib-border)",
        padding: "28px 36px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Brand */}
        <span
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 15,
            fontStyle: "italic",
            color: "var(--lib-dust)",
            letterSpacing: "0.02em",
          }}
        >
          EPUBMaker
        </span>

        {/* Links */}
        <nav style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {(["terms", "privacy"] as const).map((key) => (
            <Link
              key={key}
              href={`/${key}`}
              style={{
                fontSize: 12,
                color: "var(--lib-dust)",
                textDecoration: "none",
                transition: "color 200ms ease",
                letterSpacing: "0.03em",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
              className="nav-link"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p
          style={{
            fontSize: 12,
            color: "var(--lib-dust)",
            letterSpacing: "0.02em",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}
        >
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
