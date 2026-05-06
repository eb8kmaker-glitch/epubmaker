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
        borderTop: "1px solid rgba(214,185,123,0.1)",
        padding: "24px",
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
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 18,
            color: "rgba(214,185,123,0.6)",
            letterSpacing: "0.04em",
          }}
        >
          EPUBMaker
        </span>

        {/* Links */}
        <nav style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {(["terms", "privacy", "refund"] as const).map((key) => (
            <Link
              key={key}
              href={`/${key}`}
              style={{
                fontSize: 12,
                color: "rgba(201,184,152,0.5)",
                textDecoration: "none",
                transition: "color 0.2s ease",
                letterSpacing: "0.05em",
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
            color: "rgba(201,184,152,0.3)",
            letterSpacing: "0.03em",
          }}
        >
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
