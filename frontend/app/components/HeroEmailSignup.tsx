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
    <div className="mx-auto max-w-[420px] text-center">
      <h2 className="text-lg font-semibold tracking-tight text-[var(--content)] sm:text-xl">
        {t("title")}
      </h2>
      <p className="mt-2 text-sm text-[var(--content-muted)]">
        {t("subtitle")}
      </p>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder")}
            required
            disabled={status === "loading"}
            className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base text-[var(--content)] shadow-[var(--shadow-card)] transition placeholder:text-[var(--content-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-60"
            aria-label="Email address"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="shrink-0 rounded-xl bg-[var(--primary)] px-6 py-3 text-base font-medium text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-60"
          >
            {status === "loading" ? "…" : t("button")}
          </button>
        </div>
      </form>
      <p className="mt-3 text-xs text-[var(--content-muted)]">
        {t("trust")}
      </p>
      {status === "success" && (
        <p className="mt-3 text-sm font-medium text-[var(--primary)]" role="status">
          {t("success")}
        </p>
      )}
      {status === "already_subscribed" && (
        <p className="mt-3 text-sm font-medium text-[var(--content-muted)]" role="status">
          {t("alreadySubscribed")}
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-sm font-medium text-[var(--content-muted)]" role="alert">
          {t("error")}
        </p>
      )}
    </div>
  );
}
