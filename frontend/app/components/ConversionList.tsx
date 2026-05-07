"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import TocEditor from "./TocEditor";

interface ConversionRow {
  id: string;
  original_filename: string;
  original_size_bytes: number | null;
  created_at: string;
  status: string;
  storage_path: string | null;
  expires_at: string | null;
}

interface Props {
  conversions: ConversionRow[];
}

function isAvailable(row: ConversionRow): boolean {
  if (!row.storage_path) return false;
  if (row.status !== "completed") return false;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return false;
  return true;
}

export default function ConversionList({ conversions }: Props) {
  const t = useTranslations("ConversionList");
  const locale = useLocale();
  const [tocTarget, setTocTarget] = useState<{ blob: Blob; filename: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  function formatExpiry(expires_at: string | null): string {
    if (!expires_at) return "";
    const d = new Date(expires_at);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    if (diffMs <= 0) return t("expired");
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays >= 1) return t("expiresInDays", { days: diffDays });
    return t("expiresInHours", { hours: diffHours });
  }

  const fetchBlob = useCallback(async (id: string): Promise<Blob | null> => {
    setLoadingId(id);
    setErrorId(null);
    try {
      const res = await fetch(`/api/conversions/${id}/download`);
      if (!res.ok) {
        setErrorId(id);
        return null;
      }
      return await res.blob();
    } catch {
      setErrorId(id);
      return null;
    } finally {
      setLoadingId(null);
    }
  }, []);

  const handleDownload = useCallback(
    async (row: ConversionRow) => {
      const blob = await fetchBlob(row.id);
      if (!blob) return;
      const baseName = row.original_filename.replace(/\.[^.]+$/, "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.epub`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [fetchBlob]
  );

  const handleEdit = useCallback(
    async (row: ConversionRow) => {
      const blob = await fetchBlob(row.id);
      if (!blob) return;
      const baseName = row.original_filename.replace(/\.[^.]+$/, "");
      setTocTarget({ blob, filename: `${baseName}.epub` });
    },
    [fetchBlob]
  );

  if (!conversions.length) {
    return (
      <p className="text-sm text-[var(--lib-dust)]">{t("empty")}</p>
    );
  }

  if (tocTarget) {
    return (
      <TocEditor
        epubBlob={tocTarget.blob}
        filename={tocTarget.filename}
        onClose={() => setTocTarget(null)}
      />
    );
  }

  return (
    <ul className="space-y-2">
      {conversions.map((c) => {
        const available = isAvailable(c);
        const loading = loadingId === c.id;
        const hasError = errorId === c.id;

        return (
          <li
            key={c.id}
            className="rounded-lg border border-[var(--lib-border)] px-4 py-3 text-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--lib-ink)]">
                  {c.original_filename}
                </p>
                <p className="mt-0.5 text-xs text-[var(--lib-dust)]">
                  {new Date(c.created_at).toLocaleDateString(locale)}
                  {available && c.expires_at && (
                    <span className="ml-2 text-[var(--lib-dust)]">
                      · {formatExpiry(c.expires_at)}
                    </span>
                  )}
                  {!available && c.storage_path === null && (
                    <span className="ml-2 text-[var(--lib-dust)]">· {t("fileExpired")}</span>
                  )}
                </p>
                {hasError && (
                  <p className="mt-1 text-xs text-red-500">{t("downloadError")}</p>
                )}
              </div>

              {available && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDownload(c)}
                    className="rounded-lg border border-[var(--lib-border)] px-3 py-1 text-xs font-medium text-[var(--lib-ink)] hover:bg-[var(--lib-bg-3)] disabled:opacity-50"
                  >
                    {loading ? "…" : t("download")}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleEdit(c)}
                    className="rounded-lg bg-[var(--lib-wood-dim)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "…" : t("editToc")}
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
