export default function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 0" }}>
      <span
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(214,185,123,0.25), transparent)",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontSize: 18,
          color: "rgba(214,185,123,0.4)",
          lineHeight: 1,
        }}
      >
        ✦
      </span>
      <span
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(214,185,123,0.25), transparent)",
        }}
      />
    </div>
  );
}
