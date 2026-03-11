"use client";

import { useTranslations } from "next-intl";
import type { EpubValidationResult } from "@/app/lib/validateEpub";

export default function EpubCompatibilityCheck({
  result,
  loading,
}: {
  result: EpubValidationResult | null;
  loading?: boolean;
}) {
  const t = useTranslations("EpubCompatibilityCheck");

  if (loading) {
    return (
      <div className="mt-4 rounded-[12px] border border-[var(--guide-border)] bg-[var(--guide-bg)] p-4">
        <p className="text-sm font-medium text-[var(--content)]">{t("title")}</p>
        <p className="mt-2 text-sm text-[var(--content-muted)]">{t("validating")}</p>
      </div>
    );
  }

  if (!result) return null;

  const statusLabel =
    result.status === "ok"
      ? t("statusOk")
      : result.status === "warning"
        ? t("statusWarning")
        : t("statusError");
  const statusIcon = result.status === "ok" ? "✔" : result.status === "warning" ? "⚠" : "✖";
  const statusColor =
    result.status === "ok"
      ? "text-green-600"
      : result.status === "warning"
        ? "text-amber-600"
        : "text-red-600";

  const hasAny =
    result.metadataErrors.length > 0 ||
    result.cssWarnings.length > 0 ||
    result.navigationIssues.length > 0 ||
    result.suggestions.length > 0;

  return (
    <div className="mt-4 rounded-[12px] border border-[var(--guide-border)] bg-[var(--guide-bg)] p-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-[var(--content)]">{t("title")}</p>
        <span className={`text-sm font-medium ${statusColor}`} aria-label={statusLabel}>
          {statusIcon} {statusLabel}
        </span>
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        {result.epubVersion != null && (
          <div>
            <dt className="font-medium text-[var(--content-muted)]">{t("epubVersion")}</dt>
            <dd className="text-[var(--content)]">{result.epubVersion}</dd>
          </div>
        )}

        {result.metadataErrors.length > 0 && (
          <div>
            <dt className="font-medium text-[var(--content-muted)]">{t("metadataErrors")}</dt>
            <dd className="mt-0.5">
              <ul className="list-inside list-disc space-y-0.5 text-[var(--content)]">
                {result.metadataErrors.map((m, i) => (
                  <li key={`meta-${i}`}>
                    {m.message}
                    {m.location && <span className="text-[var(--content-muted)]"> ({m.location})</span>}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}

        {result.cssWarnings.length > 0 && (
          <div>
            <dt className="font-medium text-[var(--content-muted)]">{t("cssWarnings")}</dt>
            <dd className="mt-0.5">
              <ul className="list-inside list-disc space-y-0.5 text-[var(--content)]">
                {result.cssWarnings.map((m, i) => (
                  <li key={`css-${i}`}>
                    {m.message}
                    {m.location && <span className="text-[var(--content-muted)]"> ({m.location})</span>}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}

        {result.navigationIssues.length > 0 && (
          <div>
            <dt className="font-medium text-[var(--content-muted)]">{t("navigationIssues")}</dt>
            <dd className="mt-0.5">
              <ul className="list-inside list-disc space-y-0.5 text-[var(--content)]">
                {result.navigationIssues.map((m, i) => (
                  <li key={`nav-${i}`}>
                    {m.message}
                    {m.location && <span className="text-[var(--content-muted)]"> ({m.location})</span>}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}

        {!hasAny && result.status === "ok" && (
          <p className="text-[var(--content-muted)]">{t("noIssues")}</p>
        )}
      </dl>

      {result.suggestions.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t("fixSuggestions")}</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-amber-700 dark:text-amber-300">
            {result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
