"use client";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { BookMeta } from "@/app/lib/bookModel";

interface MetaPanelProps {
  meta: BookMeta;
  onChange: (m: BookMeta) => void;
}

const COVER_ACCEPT = "image/jpeg,image/png";
const MAX_COVER_BYTES = 10 * 1024 * 1024;

export default function MetaPanel({ meta, onChange }: MetaPanelProps) {
  const t = useTranslations("Editor");
  const set = <K extends keyof BookMeta>(key: K, val: BookMeta[K]) =>
    onChange({ ...meta, [key]: val });

  // Object URL for the cover thumbnail — derived from the blob, revoked on change/unmount.
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverBlob = meta.coverImage?.blob ?? null;
  const coverUrl = useMemo(
    () => (coverBlob ? URL.createObjectURL(coverBlob) : null),
    [coverBlob],
  );
  useEffect(() => {
    return () => { if (coverUrl) URL.revokeObjectURL(coverUrl); };
  }, [coverUrl]);

  const handleCoverSelect = (file: File | undefined) => {
    if (!file) return;
    if (!COVER_ACCEPT.split(",").includes(file.type)) {
      setCoverError(t("coverTypeError"));
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setCoverError(t("coverSizeError"));
      return;
    }
    setCoverError(null);
    set("coverImage", { blob: file, mimeType: file.type, name: file.name });
  };

  // ISBN: soft validation only — 10 or 13 digits after stripping hyphens/spaces
  // (a trailing "X" is allowed as the ISBN-10 check digit). Never blocks saving.
  const isbnNormalized = (meta.isbn ?? "").replace(/[\s-]/g, "").toUpperCase();
  const isbnInvalid =
    isbnNormalized.length > 0 &&
    !/^\d{13}$/.test(isbnNormalized) &&
    !/^\d{9}[\dX]$/.test(isbnNormalized);

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 7,
    border: "1px solid var(--lib-border)", background: "var(--lib-bg)",
    fontSize: 13, color: "var(--lib-ink)", outline: "none",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    boxSizing: "border-box",
  };
  const labelSt: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--lib-dust)", display: "block", marginBottom: 4,
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        {t("bookSettings")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={labelSt}>{t("titleLabel")}</label><input style={{ ...inputSt, fontFamily: "var(--font-serif), Georgia, serif", fontSize: 14 }} value={meta.title} onChange={(e) => set("title", e.target.value)} placeholder={t("titlePlaceholder")} /></div>
        <div><label style={labelSt}>{t("authorLabel")}</label><input style={inputSt} value={meta.author} onChange={(e) => set("author", e.target.value)} placeholder={t("authorPlaceholder")} /></div>
        <div><label style={labelSt}>{t("languageLabel")}</label>
          <select style={inputSt} value={meta.language} onChange={(e) => set("language", e.target.value as BookMeta["language"])}>
            <option value="ko">한국어</option><option value="en">English</option>
            <option value="ja">日本語</option><option value="zh">中文</option>
          </select>
        </div>
        <div><label style={labelSt}>{t("publisherLabel")}</label><input style={inputSt} value={meta.publisher} onChange={(e) => set("publisher", e.target.value)} placeholder={t("publisherPlaceholder")} /></div>
        <div>
          <label style={labelSt}>{t("isbnLabel")}</label>
          <input
            style={isbnInvalid ? { ...inputSt, borderColor: "#dca0a0" } : inputSt}
            value={meta.isbn}
            onChange={(e) => set("isbn", e.target.value)}
            placeholder={t("isbnPlaceholder")}
            inputMode="numeric"
            aria-invalid={isbnInvalid}
          />
          {isbnInvalid && (
            <p style={{ marginTop: 5, fontSize: 11, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
              {t("isbnHint")}
            </p>
          )}
        </div>
        <div><label style={labelSt}>{t("dateLabel")}</label><input style={inputSt} value={meta.date} onChange={(e) => set("date", e.target.value)} placeholder="2024-01-01" /></div>

        {/* Cover image */}
        <div>
          <label style={labelSt}>{t("coverLabel")}</label>
          {meta.coverImage ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={t("coverLabel")}
                  style={{ width: 48, height: 64, objectFit: "cover", borderRadius: 5, border: "1px solid var(--lib-border)", flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "var(--lib-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                  {meta.coverImage.name}
                </p>
                <button
                  type="button"
                  onClick={() => { setCoverError(null); set("coverImage", null); }}
                  style={{ marginTop: 2, fontSize: 11, color: "var(--lib-dust)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2, padding: 0, fontFamily: "var(--font-sans), system-ui, sans-serif" }}
                >
                  {t("coverRemove")}
                </button>
              </div>
            </div>
          ) : (
            <label style={{ display: "block", cursor: "pointer" }}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                padding: "16px 12px", borderRadius: 7, border: "1.5px dashed var(--lib-border-2)",
                background: "var(--lib-bg)", textAlign: "center",
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--lib-dusk)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                  {t("coverButton")}
                </span>
                <span style={{ fontSize: 11, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                  {t("coverHint")}
                </span>
              </div>
              <input
                type="file"
                accept={COVER_ACCEPT}
                onChange={(e) => { handleCoverSelect(e.target.files?.[0]); e.target.value = ""; }}
                style={{ display: "none" }}
              />
            </label>
          )}
          {coverError && (
            <p role="alert" style={{ marginTop: 6, fontSize: 11, color: "#b91c1c", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
              {coverError}
            </p>
          )}
        </div>

        <div style={{ height: 1, background: "var(--lib-border)" }} />

        <div><label style={labelSt}>{t("epubVersionLabel")}</label>
          <select style={inputSt} value={meta.epubVersion} onChange={(e) => set("epubVersion", e.target.value as BookMeta["epubVersion"])}>
            <option value="epub3">{t("epub3Recommended")}</option><option value="epub2">{t("epub2")}</option>
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={meta.toc} onChange={(e) => set("toc", e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--lib-wood-dim)" }} />
          <span style={{ fontSize: 13, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>{t("includeToc")}</span>
        </label>

        <div style={{ height: 1, background: "var(--lib-border)" }} />

        <div>
          <label style={labelSt}>{t("stylePresetLabel")}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(["default", "book", "novel", "academic"] as const).map((s) => (
              <button key={s} type="button" onClick={() => set("style", s)} style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 11, border: "1.5px solid",
                borderColor: meta.style === s ? "var(--lib-wood-dim)" : "var(--lib-border)",
                background: meta.style === s ? "var(--lib-wood-dim)" : "transparent",
                color: meta.style === s ? "#F8F5F0" : "var(--lib-dusk)",
                cursor: "pointer", fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontWeight: meta.style === s ? 600 : 400, transition: "all 0.15s ease",
              }}>
                {{ default: t("styleDefault"), book: t("styleBook"), novel: t("styleNovel"), academic: t("styleAcademic") }[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
