"use client";

import { useTranslations } from "next-intl";

export type StylePreset = "default" | "book" | "novel" | "academic";

export type MetadataLanguage = "ko" | "en" | "ja" | "zh";

export interface ConversionOptions {
  toc: boolean;
  tocDepth: number;
  epubVersion: "epub3" | "epub2";
  title: string;
  author: string;
  language: MetadataLanguage;
  publisher: string;
  date: string;
  style: StylePreset;
}

const DEFAULT_OPTIONS: ConversionOptions = {
  toc: true,
  tocDepth: 3,
  epubVersion: "epub3",
  title: "",
  author: "",
  language: "ko",
  publisher: "",
  date: "",
  style: "default",
};

const COVER_ACCEPT = "image/jpeg,image/png";

interface ConversionSettingsProps {
  options: ConversionOptions;
  onChange: (options: ConversionOptions) => void;
  coverFile: File | null;
  onCoverFileChange: (file: File | null) => void;
}

export default function ConversionSettings({
  options,
  onChange,
  coverFile,
  onCoverFileChange,
}: ConversionSettingsProps) {
  const t = useTranslations("ConversionSettings");
  const setOption = <K extends keyof ConversionOptions>(
    key: K,
    value: ConversionOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  const inputClass =
    "w-full rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--content)] placeholder-[var(--content-muted)] transition-all duration-200 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]";
  const labelClass = "mb-1 block text-xs font-medium text-[var(--content-muted)]";

  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)] transition-all duration-200">
      <h3 className="mb-3 text-sm font-semibold text-[var(--content)]">
        {t("heading")}
      </h3>

      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={options.toc}
            onChange={(e) => setOption("toc", e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] transition-all duration-200 focus:ring-[var(--primary)]"
          />
          <span className="text-sm text-[var(--content)]">
            {t("includeToc")}
          </span>
        </label>

        <div>
          <label className={labelClass}>{t("tocDepth")}</label>
          <select
            value={options.tocDepth}
            onChange={(e) => setOption("tocDepth", Number(e.target.value) as 1 | 2 | 3)}
            className={inputClass}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>{t("epubVersion")}</label>
          <select
            value={options.epubVersion}
            onChange={(e) => setOption("epubVersion", e.target.value as "epub3" | "epub2")}
            className={inputClass}
          >
            <option value="epub3">{t("epub3")}</option>
            <option value="epub2">{t("epub2")}</option>
          </select>
        </div>

        <p className="border-t border-[var(--border)] pt-4 text-xs font-semibold uppercase tracking-wider text-[var(--content-muted)]">
          {t("metadata")}
        </p>

        <div>
          <label className={labelClass}>{t("title")}</label>
          <input
            type="text"
            value={options.title}
            onChange={(e) => setOption("title", e.target.value)}
            placeholder={t("titlePlaceholder")}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t("author")}</label>
          <input
            type="text"
            value={options.author}
            onChange={(e) => setOption("author", e.target.value)}
            placeholder={t("authorPlaceholder")}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t("language")}</label>
          <select
            value={options.language}
            onChange={(e) => setOption("language", e.target.value as ConversionOptions["language"])}
            className={inputClass}
          >
            <option value="ko">Korean (ko)</option>
            <option value="en">English (en)</option>
            <option value="ja">Japanese (ja)</option>
            <option value="zh">Chinese (zh)</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>{t("publisher")}</label>
          <input
            type="text"
            value={options.publisher}
            onChange={(e) => setOption("publisher", e.target.value)}
            placeholder={t("publisherPlaceholder")}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t("date")}</label>
          <input
            type="text"
            value={options.date}
            onChange={(e) => setOption("date", e.target.value)}
            placeholder={t("datePlaceholder")}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t("stylePreset")}</label>
          <select
            value={options.style}
            onChange={(e) => setOption("style", e.target.value as ConversionOptions["style"])}
            className={inputClass}
          >
            <option value="default">{t("styleDefault")}</option>
            <option value="book">{t("styleBook")}</option>
            <option value="novel">{t("styleNovel")}</option>
            <option value="academic">{t("styleAcademic")}</option>
          </select>
        </div>

        <div>
          <p className={labelClass}>{t("coverImage")}</p>
          {!coverFile ? (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="file"
                accept={COVER_ACCEPT}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onCoverFileChange(f);
                  e.target.value = "";
                }}
                className="text-sm text-[var(--content-muted)] file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--guide-bg)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--primary)] file:transition-all file:duration-200 hover:file:bg-[var(--guide-border)]"
              />
              <span className="text-xs text-[var(--content-muted)]">
                {t("coverHint")}
              </span>
            </label>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--guide-bg)] px-3 py-2">
              <span className="min-w-0 truncate text-sm text-[var(--content)]">
                {coverFile.name}
              </span>
              <button
                type="button"
                onClick={() => onCoverFileChange(null)}
                className="shrink-0 text-sm text-[var(--content-muted)] underline underline-offset-2 transition-colors duration-200 hover:text-[var(--primary)]"
              >
                {t("remove")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_OPTIONS };
