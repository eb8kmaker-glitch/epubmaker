import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import NavbarUserClient from "@/app/components/layout/NavbarUserClient";

interface NavbarProps {
  locale: string;
}

export default async function Navbar({ locale }: NavbarProps) {
  const t = await getTranslations("Navbar");
  const tCommon = await getTranslations("common");

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 60,
        display: "flex",
        alignItems: "center",
        background: "var(--lib-panel)",
        borderBottom: "1px solid var(--lib-border)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            lineHeight: 1.2,
            flexShrink: 0,
            gap: 1,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--lib-wood-dim)",
              letterSpacing: "0.01em",
            }}
          >
            EPUBMaker
          </span>
          <span
            style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: 13,
              color: "var(--lib-dust)",
              letterSpacing: "0.04em",
            }}
          >
            {tCommon("siteName")}
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: 24, flex: 1 }}>
          <Link
            href="/convert"
            className="nav-link"
            style={{
              fontSize: 13,
              textDecoration: "none",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {t("convert")}
          </Link>
        </nav>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <NavbarUserClient locale={locale} />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
