import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import NavbarUserClient from "@/app/components/layout/NavbarUserClient";

interface NavbarProps {
  locale: string;
  navFeatures: string;
  siteName: string;
}

export default function Navbar({ locale, navFeatures, siteName }: NavbarProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 68,
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(180deg, #1A100A 0%, rgba(26,16,10,0.92) 100%)",
        borderBottom: "1px solid rgba(214,185,123,0.18)",
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
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ color: "var(--gold)" }}>EPUB</span>
            <span style={{ color: "var(--cream)" }}>Maker</span>
          </span>
          <span
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 11,
              fontStyle: "italic",
              color: "var(--cream-dim)",
              letterSpacing: "0.08em",
              opacity: 0.7,
            }}
          >
            {siteName}
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: 28, flex: 1 }}>
          <Link
            href="/#features"
            className="nav-link"
            style={{
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
              fontFamily: "var(--font-jost), sans-serif",
              fontWeight: 400,
            }}
          >
            {navFeatures}
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
