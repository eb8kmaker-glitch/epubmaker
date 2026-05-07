"use client";

import { useTranslations } from "next-intl";
import { EPUB_STYLES } from "@/app/lib/epubStyles";

export type StylePreset = "default" | "book" | "novel" | "academic" | "custom";

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
  customCss: string;
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
  customCss: "",
};

const COVER_ACCEPT = "image/jpeg,image/png";

interface ConversionSettingsProps {
  options: ConversionOptions;
  onChange: (options: ConversionOptions) => void;
  coverFile: File | null;
  onCoverFileChange: (file: File | null) => void;
}

const STYLE_PRESETS: Array<{
  value: StylePreset;
  labelKey: "styleDefault" | "styleBook" | "styleNovel" | "styleAcademic" | "styleCustom";
}> = [
  { value: "default", labelKey: "styleDefault" },
  { value: "book",    labelKey: "styleBook" },
  { value: "novel",   labelKey: "styleNovel" },
  { value: "academic",labelKey: "styleAcademic" },
  { value: "custom",  labelKey: "styleCustom" },
];

export default function ConversionSettings({
  options,
  onChange,
  coverFile,
  onCoverFileChange,
}: ConversionSettingsProps) {
  const t = useTranslations("ConversionSettings");

  const setOption = <K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    borderRadius: 6,
    border: "1px solid var(--lib-border)",
    background: "var(--lib-panel)",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    fontSize: 13,
    color: "var(--lib-ink)",
    outline: "none",
    transition: "border-color 200ms ease",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 4,
    fontSize: 12,
    fontWeight: 500,
    color: "var(--lib-dust)",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  };

  function handleStyleChange(newStyle: StylePreset) {
    if (newStyle === "custom") {
      const basePreset = options.style !== "custom" ? options.style : "default";
      const baseCss = EPUB_STYLES[basePreset] ?? EPUB_STYLES.default ?? "";
      onChange({ ...options, style: "custom", customCss: options.customCss || baseCss });
    } else {
      setOption("style", newStyle);
    }
  }

  function handleLoadPreset(preset: string) {
    const css = EPUB_STYLES[preset] ?? EPUB_STYLES.default ?? "";
    setOption("customCss", css);
  }

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--lib-border)",
        background: "var(--lib-panel)",
        padding: 16,
        transition: "all 200ms",
      }}
    >
      <h3
        style={{
          marginBottom: 12,
          fontSize: 13,
          fontWeight: 600,
          color: "var(--lib-ink)",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        {t("heading")}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* TOC toggle */}
        <label style={{ display: "flex", cursor: "pointer", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={options.toc}
            onChange={(e) => setOption("toc", e.target.checked)}
            style={{
              width: 16,
              height: 16,
              accentColor: "var(--lib-wood-dim)",
            }}
          />
          <span style={{ fontSize: 13, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
            {t("includeToc")}
          </span>
        </label>

        {/* TOC depth */}
        <div>
          <label style={labelStyle}>{t("tocDepth")}</label>
          <select
            value={options.tocDepth}
            onChange={(e) => setOption("tocDepth", Number(e.target.value) as 1 | 2 | 3)}
            style={inputStyle}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>

        {/* EPUB version */}
        <div>
          <label style={labelStyle}>{t("epubVersion")}</label>
          <select
            value={options.epubVersion}
            onChange={(e) => setOption("epubVersion", e.target.value as "epub3" | "epub2")}
            style={inputStyle}
          >
            <option value="epub3">{t("epub3")}</option>
            <option value="epub2">{t("epub2")}</option>
          </select>
        </div>

        {/* Metadata divider */}
        <p
          style={{
            borderTop: "1px solid var(--lib-border)",
            paddingTop: 12,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--lib-dust)",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}
        >
          {t("metadata")}
        </p>

        {/* Title */}
        <div>
          <label style={labelStyle}>{t("title")}</label>
          <input
            type="text"
            value={options.title}
            onChange={(e) => setOption("title", e.target.value)}
            placeholder={t("titlePlaceholder")}
            style={inputStyle}
          />
        </div>

        {/* Author */}
        <div>
          <label style={labelStyle}>{t("author")}</label>
          <input
            type="text"
            value={options.author}
            onChange={(e) => setOption("author", e.target.value)}
            placeholder={t("authorPlaceholder")}
            style={inputStyle}
          />
        </div>

        {/* Language */}
        <div>
          <label style={labelStyle}>{t("language")}</label>
          <select
            value={options.language}
            onChange={(e) => setOption("language", e.target.value as ConversionOptions["language"])}
            style={inputStyle}
          >
            <option value="ko">Korean (ko)</option>
            <option value="en">English (en)</option>
            <option value="ja">Japanese (ja)</option>
            <option value="zh">Chinese (zh)</option>
          </select>
        </div>

        {/* Publisher */}
        <div>
          <label style={labelStyle}>{t("publisher")}</label>
          <input
            type="text"
            value={options.publisher}
            onChange={(e) => setOption("publisher", e.target.value)}
            placeholder={t("publisherPlaceholder")}
            style={inputStyle}
          />
        </div>

        {/* Date */}
        <div>
          <label style={labelStyle}>{t("date")}</label>
          <input
            type="text"
            value={options.date}
            onChange={(e) => setOption("date", e.target.value)}
            placeholder={t("datePlaceholder")}
            style={inputStyle}
          />
        </div>

        {/* Style chips */}
        <div>
          <label style={labelStyle}>{t("stylePreset")}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {STYLE_PRESETS.map(({ value, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStyleChange(value)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  border: "1px solid var(--lib-border)",
                  color: options.style === value ? "#F8F5F0" : "var(--lib-dusk)",
                  background: options.style === value ? "var(--lib-wood-dim)" : "transparent",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                }}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom CSS editor */}
        {options.style === "custom" && (
          <div>
            <div style={{ marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{t("customCssLabel")}</label>
              <div style={{ display: "flex", gap: 4 }}>
                {(["default", "book", "novel", "academic"] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleLoadPreset(preset)}
                    style={{
                      padding: "2px 6px",
                      fontSize: 10,
                      fontWeight: 500,
                      color: "var(--lib-wood-dim)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                    }}
                  >
                    {t(`style${preset.charAt(0).toUpperCase() + preset.slice(1)}` as "styleDefault" | "styleBook" | "styleNovel" | "styleAcademic")}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={options.customCss}
              onChange={(e) => setOption("customCss", e.target.value)}
              placeholder={t("customCssPlaceholder")}
              rows={14}
              spellCheck={false}
              style={{
                ...inputStyle,
                fontFamily: "var(--font-mono), monospace",
                fontSize: 12,
                resize: "vertical",
              }}
            />
            <p style={{ marginTop: 4, fontSize: 11, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
              {t("customCssHint")}
            </p>
          </div>
        )}

        {/* Cover image */}
        <div>
          <p style={labelStyle}>{t("coverImage")}</p>
          {!coverFile ? (
            <label style={{ display: "flex", cursor: "pointer", alignItems: "center", gap: 8 }}>
              <input
                type="file"
                accept={COVER_ACCEPT}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onCoverFileChange(f);
                  e.target.value = "";
                }}
                style={{ fontSize: 13, color: "var(--lib-dust)" }}
              />
              <span style={{ fontSize: 12, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                {t("coverHint")}
              </span>
            </label>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                borderRadius: 6,
                border: "1px solid var(--lib-border)",
                background: "var(--lib-bg-2)",
                padding: "7px 10px",
              }}
            >
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  color: "var(--lib-ink)",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                }}
              >
                {coverFile.name}
              </span>
              <button
                type="button"
                onClick={() => onCoverFileChange(null)}
                style={{
                  flexShrink: 0,
                  fontSize: 12,
                  color: "var(--lib-dust)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                  transition: "color 200ms ease",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                }}
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
