// Shared conversion option types + defaults.
//
// These describe the options sent to the /api/convert endpoint and are reused
// by the editor flow. (The standalone settings UI that once rendered these —
// together with its cover-upload control — was removed; cover upload now lives
// in the editor's book-settings panel, see MetaPanel.tsx.)

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

export const DEFAULT_OPTIONS: ConversionOptions = {
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
