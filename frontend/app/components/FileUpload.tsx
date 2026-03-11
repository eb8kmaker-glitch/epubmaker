"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import ConversionSettings, {
  DEFAULT_OPTIONS,
  type ConversionOptions,
} from "./ConversionSettings";
import EpubPreview from "./EpubPreview";

const ACCEPTED_TYPES = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
  "application/pdf": ".pdf",
};

const ACCEPTED_EXTENSIONS = [".docx", ".txt", ".pdf"];
const ACCEPTED_STRING = ".docx, .txt, .pdf";
const CONVERT_TO_EPUB_EXTENSIONS = [".docx", ".txt"];
const MAX_TEXT_CHARS = 30_000;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const BETA_DAILY_LIMIT = 3;
const BETA_STORAGE_KEY = "epubmaker_beta_usage";

function getBetaUsage(): { count: number; date: string } {
  if (typeof window === "undefined") return { count: 0, date: "" };
  const today = new Date().toDateString();
  try {
    const raw = localStorage.getItem(BETA_STORAGE_KEY);
    if (!raw) return { count: 0, date: today };
    const { date, count } = JSON.parse(raw) as { date: string; count: number };
    if (date !== today) return { count: 0, date: today };
    return { date, count };
  } catch {
    return { count: 0, date: today };
  }
}

function incrementBetaUsage(): void {
  const u = getBetaUsage();
  const today = new Date().toDateString();
  const newCount = u.date === today ? u.count + 1 : 1;
  localStorage.setItem(BETA_STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function isValidFile(file: File): boolean {
  const ext = getExtension(file.name);
  return (
    ACCEPTED_EXTENSIONS.includes(ext) ||
    file.type in ACCEPTED_TYPES
  );
}

function canConvertToEpub(file: File): boolean {
  return CONVERT_TO_EPUB_EXTENSIONS.includes(getExtension(file.name));
}

export default function FileUpload() {
  const t = useTranslations("FileUpload");
  const tDocx = useTranslations("docxGuide");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [previewFile, setPreviewFile] = useState<Blob | null>(null);
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [betaUsage, setBetaUsage] = useState(() => getBetaUsage());

  useEffect(() => {
    setBetaUsage(getBetaUsage());
  }, [converting]);

  const handleFiles = useCallback((files: FileList | null) => {
    setError(null);
    if (!files?.length) return;
    const f = files[0];
    if (!isValidFile(f)) {
      setError(t("errorFileType", { name: f.name }));
      setFile(null);
      return;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(t("errorFileSize"));
      setFile(null);
      return;
    }
    const ext = getExtension(f.name);
    if (ext === ".txt") {
      const reader = new FileReader();
      reader.onload = () => {
        const text = (reader.result as string) ?? "";
        if (text.length > MAX_TEXT_CHARS) {
          setError(t("errorTextLength", { max: MAX_TEXT_CHARS.toLocaleString(), current: text.length.toLocaleString() }));
          setFile(null);
          return;
        }
        setFile(f);
      };
      reader.readAsText(f, "UTF-8");
      return;
    }
    setFile(f);
  }, [t]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      e.target.value = "";
    },
    [handleFiles]
  );

  const clearFile = useCallback(() => {
    setPreviewFile(null);
    setCoverFile(null);
    setFile(null);
    setError(null);
    setConvertError(null);
  }, []);

  const handleCoverFileChange = useCallback((newCover: File | null) => {
    if (newCover && newCover.size > MAX_FILE_SIZE_BYTES) {
      setError(t("errorCoverSize"));
      return;
    }
    setError(null);
    setCoverFile(newCover);
  }, [t]);

  const atBetaDailyLimit = betaUsage.count >= BETA_DAILY_LIMIT;

  const convertToEpub = useCallback(async () => {
    if (!file || !canConvertToEpub(file)) return;
    if (atBetaDailyLimit) {
      setConvertError(t("dailyLimit"));
      return;
    }
    setConvertError(null);
    setConverting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("options", JSON.stringify(conversionOptions));
      if (coverFile) {
        formData.append("cover", coverFile);
      }
      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Conversion failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match ? match[1].trim() : "document.epub";
      setPreviewFile(blob);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      incrementBetaUsage();
      setBetaUsage(getBetaUsage());
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : t("errorConversionFailed"));
    } finally {
      setConverting(false);
    }
  }, [file, conversionOptions, coverFile, atBetaDailyLimit]);

  return (
    <div className="w-full max-w-lg space-y-6">
      <label className="block">
        <span className="sr-only">Choose file</span>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`
            relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-[12px] border-2 border-dashed px-6 py-10
            transition-all duration-200 ease-in-out
            ${isDragging
              ? "border-[var(--accent-soft)] bg-[var(--dropzone-hover)]"
              : "border-[var(--accent-soft)] bg-[var(--secondary-bg)] hover:bg-[var(--dropzone-hover)]"
            }
          `}
        >
          <input
            type="file"
            accept={ACCEPTED_STRING}
            onChange={onInputChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Upload DOCX, TXT or PDF file"
          />
          <span className="mb-2 text-4xl" aria-hidden>
            📄
          </span>
          <p className="text-center text-sm font-medium text-[var(--content-muted)]">
            {isDragging ? t("dropHere") : t("dropText")}
          </p>
          <p className="mt-1 text-center text-xs text-[var(--content-muted)]">
            {t("browse", { extensions: ACCEPTED_STRING })}
          </p>
        </div>
      </label>

      <div
        role="region"
        aria-label={tDocx("title")}
        className="rounded-[12px] border border-[var(--guide-border)] bg-[var(--guide-bg)] px-4 py-3 transition-all duration-200"
      >
        <p className="flex items-start gap-2 text-sm font-medium text-[var(--content)]">
          <span className="mt-0.5 shrink-0 text-base text-[var(--accent)]" aria-hidden>
            📋
          </span>
          <span>{tDocx("title")}</span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--content-muted)]">
          {tDocx("description")}
        </p>
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-[var(--content-muted)]">
          <li>{tDocx("heading1")}</li>
          <li>{tDocx("heading2")}</li>
          <li>{tDocx("heading3")}</li>
        </ul>
        <p className="mt-2 text-xs font-medium text-[var(--content)]">
          {tDocx("howTo")}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--content-muted)]">
          {tDocx("path")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--content-muted)]">
          {tDocx("note")}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {error}
        </div>
      )}

      {convertError && (
        <div
          role="alert"
          className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {convertError}
        </div>
      )}

      {file && (
        <>
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)] transition-all duration-200">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--content-muted)]">
              {t("uploadedFile")}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate font-medium text-[var(--content)]">
                {file.name}
              </p>
              <span className="shrink-0 rounded-lg bg-[var(--guide-bg)] px-2 py-1 font-mono text-sm text-[var(--content-muted)]">
                {formatBytes(file.size)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearFile}
                className="text-sm text-[var(--content-muted)] underline underline-offset-2 transition-colors duration-200 hover:text-[var(--primary)]"
              >
                {t("removeFile")}
              </button>
            </div>
          </div>

          {canConvertToEpub(file) && (
            <>
              <ConversionSettings
                options={conversionOptions}
                onChange={setConversionOptions}
                coverFile={coverFile}
                onCoverFileChange={handleCoverFileChange}
              />
              {atBetaDailyLimit && (
                <p className="text-sm text-amber-700">
                  {t("dailyLimit")}
                </p>
              )}
              <div>
                <button
                  type="button"
                  onClick={convertToEpub}
                  disabled={converting || atBetaDailyLimit}
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  {converting ? t("converting") : t("convertButton")}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {previewFile && (
        <div className="mt-6 w-full max-w-3xl">
          <EpubPreview file={previewFile} />
        </div>
      )}
    </div>
  );
}
