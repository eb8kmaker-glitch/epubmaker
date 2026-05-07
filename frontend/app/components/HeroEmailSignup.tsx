"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "loading" | "success" | "already_subscribed" | "error";

export default function HeroEmailSignup() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; error?: string };

      if (res.ok && data.success) {
        setStatus("success");
        setEmail("");
        return;
      }

      if (data.error === "already_subscribed") {
        setStatus("already_subscribed");
        return;
      }

      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      {/* Section label */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--lib-dust)",
          marginBottom: 10,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        {t("label")}
      </div>

      <h2
        style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: 28,
          fontWeight: 500,
          color: "var(--lib-ink)",
          marginBottom: 8,
        }}
      >
        {t("title")}
      </h2>

      <p
        style={{
          fontSize: 14,
          fontWeight: 300,
          color: "var(--lib-dusk)",
          marginBottom: 24,
          lineHeight: 1.6,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        {t("subtitle")}
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder")}
            required
            disabled={status === "loading"}
            style={{
              flex: "1 1 220px",
              minWidth: 0,
              background: "var(--lib-bg-3)",
              border: "1px solid var(--lib-border)",
              borderRadius: 6,
              padding: "10px 14px",
              fontSize: 14,
              color: "var(--lib-ink)",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--lib-border-2)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--lib-border)"; }}
            aria-label={t("placeholder")}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 6,
              border: "none",
              background: "var(--lib-wood-dim)",
              color: "#F8F5F0",
              cursor: status === "loading" ? "wait" : "pointer",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              letterSpacing: "0.02em",
              opacity: status === "loading" ? 0.7 : 1,
              flexShrink: 0,
              transition: "opacity 200ms ease",
            }}
          >
            {status === "loading" ? "…" : t("button")}
          </button>
        </div>
      </form>

      <p
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "var(--lib-dust)",
          letterSpacing: "0.03em",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        {t("trust")}
      </p>

      {status === "success" && (
        <p
          style={{ marginTop: 12, fontSize: 13, color: "var(--lib-gold)", fontWeight: 400 }}
          role="status"
        >
          {t("success")}
        </p>
      )}
      {status === "already_subscribed" && (
        <p
          style={{ marginTop: 12, fontSize: 13, color: "var(--lib-dusk)" }}
          role="status"
        >
          {t("alreadySubscribed")}
        </p>
      )}
      {status === "error" && (
        <p
          style={{ marginTop: 12, fontSize: 13, color: "#ef4444" }}
          role="alert"
        >
          {t("error")}
        </p>
      )}
    </div>
  );
}
