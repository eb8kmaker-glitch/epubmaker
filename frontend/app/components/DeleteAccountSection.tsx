"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteAccount } from "@/app/actions/auth";

interface Props {
  locale: string;
}

export default function DeleteAccountSection({ locale }: Props) {
  const t = useTranslations("Account");
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount(locale);
      if (result?.error) {
        setError(t("deleteError"));
        setShowModal(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        {t("deleteAccount")}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold text-[var(--content)]">
              {t("deleteConfirmTitle")}
            </h2>
            <p className="mb-6 text-sm text-[var(--content-muted)]">
              {t("deleteConfirmDesc")}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--content)] transition-colors hover:bg-[var(--dropzone-hover)] disabled:opacity-50"
              >
                {t("deleteCancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "…" : t("deleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
