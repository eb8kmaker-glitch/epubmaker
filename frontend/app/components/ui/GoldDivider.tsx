export default function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0" }}>
      <span
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--lib-border-2), transparent)",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: 14,
          color: "var(--lib-gold)",
          lineHeight: 1,
          opacity: 0.6,
        }}
      >
        ✦
      </span>
      <span
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--lib-border-2), transparent)",
        }}
      />
    </div>
  );
}
