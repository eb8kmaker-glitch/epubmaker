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
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "var(--gold)",
          marginBottom: 10,
          fontFamily: "var(--font-jost), sans-serif",
        }}
      >
        Newsletter
      </div>

      <h2
        style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontSize: 28,
          fontWeight: 500,
          color: "var(--cream)",
          marginBottom: 8,
        }}
      >
        {t("title")}
      </h2>

      <p
        style={{
          fontSize: 14,
          fontWeight: 300,
          color: "var(--cream-dim)",
          marginBottom: 24,
          lineHeight: 1.6,
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
              background: "rgba(58,42,34,0.6)",
              border: "1px solid rgba(214,185,123,0.25)",
              borderRadius: 2,
              padding: "12px 16px",
              fontSize: 14,
              color: "var(--cream)",
              fontFamily: "var(--font-jost), sans-serif",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(214,185,123,0.6)";
              e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(214,185,123,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(214,185,123,0.25)";
              e.currentTarget.style.boxShadow = "none";
            }}
            aria-label="Email address"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-gold"
            style={{
              padding: "12px 24px",
              fontSize: 14,
              borderRadius: 2,
              border: "none",
              cursor: status === "loading" ? "wait" : "pointer",
              fontFamily: "var(--font-jost), sans-serif",
              letterSpacing: "0.04em",
              opacity: status === "loading" ? 0.7 : 1,
              flexShrink: 0,
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
          color: "rgba(201,184,152,0.4)",
          letterSpacing: "0.03em",
        }}
      >
        {t("trust")}
      </p>

      {status === "success" && (
        <p
          style={{ marginTop: 12, fontSize: 13, color: "var(--gold)", fontWeight: 400 }}
          role="status"
        >
          {t("success")}
        </p>
      )}
      {status === "already_subscribed" && (
        <p
          style={{ marginTop: 12, fontSize: 13, color: "var(--cream-dim)" }}
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
