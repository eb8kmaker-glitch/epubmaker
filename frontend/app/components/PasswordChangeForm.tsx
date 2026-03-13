"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { changePassword } from "@/app/actions/auth";

export default function PasswordChangeForm() {
  const t = useTranslations("Account");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError(t("passwordMin"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    startTransition(async () => {
      const result = await changePassword(newPassword);
      if (result.error) {
        setError(t("passwordError"));
      } else {
        setSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--content)]">
          {t("newPassword")}
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--content)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--content)]">
          {t("confirmPassword")}
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--content)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600" role="status">
          {t("passwordChanged")}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "…" : t("savePassword")}
      </button>
    </form>
  );
}
