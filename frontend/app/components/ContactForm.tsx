"use client";

import { useForm, ValidationError } from "@formspree/react";
import { useTranslations } from "next-intl";

export default function ContactForm() {
  const t = useTranslations("Contact");
  const [state, handleSubmit] = useForm("xykvlldd");

  if (state.succeeded) {
    return (
      <div
        style={{
          padding: "32px 24px",
          background: "var(--lib-bg-3)",
          borderRadius: 8,
          textAlign: "center",
          color: "var(--lib-ink)",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          fontSize: 15,
        }}
      >
        {t("success")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Name */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          htmlFor="name"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--lib-ink)",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          {t("nameLabel")}
        </label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder={t("namePlaceholder")}
          required
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid var(--lib-border)",
            background: "var(--lib-bg-2)",
            color: "var(--lib-ink)",
            fontSize: 14,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            outline: "none",
          }}
        />
        <ValidationError field="name" prefix={t("nameLabel")} errors={state.errors} />
      </div>

      {/* Email */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          htmlFor="email"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--lib-ink)",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          {t("emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder={t("emailPlaceholder")}
          required
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid var(--lib-border)",
            background: "var(--lib-bg-2)",
            color: "var(--lib-ink)",
            fontSize: 14,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            outline: "none",
          }}
        />
        <ValidationError field="email" prefix={t("emailLabel")} errors={state.errors} />
      </div>

      {/* Message */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          htmlFor="message"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--lib-ink)",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          {t("messageLabel")}
        </label>
        <textarea
          id="message"
          name="message"
          placeholder={t("messagePlaceholder")}
          required
          rows={6}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid var(--lib-border)",
            background: "var(--lib-bg-2)",
            color: "var(--lib-ink)",
            fontSize: 14,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            resize: "vertical",
            outline: "none",
          }}
        />
        <ValidationError field="message" prefix={t("messageLabel")} errors={state.errors} />
      </div>

      <ValidationError errors={state.errors} />

      <button
        type="submit"
        disabled={state.submitting}
        style={{
          alignSelf: "flex-start",
          padding: "10px 28px",
          borderRadius: 6,
          background: state.submitting ? "var(--lib-dust)" : "var(--lib-wood-dim)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          border: "none",
          cursor: state.submitting ? "not-allowed" : "pointer",
          transition: "opacity 200ms ease",
          letterSpacing: "0.02em",
        }}
      >
        {state.submitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
