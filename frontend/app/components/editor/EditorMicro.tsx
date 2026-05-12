"use client";
// Shared micro-components used across BookEditor panels.
import type React from "react";

export function Divider() {
  return <span style={{ width: 1, height: 16, background: "var(--lib-border)", flexShrink: 0 }} aria-hidden />;
}

export function SpinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: "be-spin 1s linear infinite" }} aria-hidden>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ChipBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 500,
        border: `1px solid ${danger ? "rgba(220,38,38,0.3)" : "var(--lib-border)"}`,
        background: "transparent",
        color: danger ? "#b91c1c" : "var(--lib-dusk)",
        cursor: "pointer",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "rgba(220,38,38,0.06)" : "var(--lib-bg-3)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}
