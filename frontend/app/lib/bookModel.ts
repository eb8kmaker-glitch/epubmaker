// ── Internal Book Data Model ───────────────────────────────────────────────
// Represents the in-memory structure of a book being edited.
// This sits between the source file (DOCX/TXT) and the output EPUB.

export type BlockType = "paragraph" | "h2" | "h3" | "image" | "quote";

export interface TextBlock {
  id: string;
  type: "paragraph" | "h2" | "h3" | "quote";
  html: string;
}

export interface ImageBlock {
  id: string;
  type: "image";
  src: string;      // object URL or data URL
  alt: string;
  caption: string;
}

export type Block = TextBlock | ImageBlock;

export interface Chapter {
  id: string;
  title: string;      // displayed as H1 in the EPUB chapter
  blocks: Block[];
  collapsed: boolean;
}

export interface BookMeta {
  title: string;
  author: string;
  language: "ko" | "en" | "ja" | "zh";
  publisher: string;
  date: string;
  epubVersion: "epub2" | "epub3";
  toc: boolean;
  tocDepth: 1 | 2 | 3;
  style: "default" | "book" | "novel" | "academic" | "custom";
  customCss: string;
}

export interface BookModel {
  meta: BookMeta;
  chapters: Chapter[];
}

// ── Factory helpers ──────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function defaultMeta(): BookMeta {
  return {
    title: "",
    author: "",
    language: "ko",
    publisher: "",
    date: new Date().toISOString().slice(0, 10),
    epubVersion: "epub3",
    toc: true,
    tocDepth: 2,
    style: "default",
    customCss: "",
  };
}

export function newChapter(title = "새 챕터"): Chapter {
  return {
    id: uid(),
    title,
    blocks: [{ id: uid(), type: "paragraph", html: "" }],
    collapsed: false,
  };
}

export function emptyBook(): BookModel {
  return {
    meta: defaultMeta(),
    chapters: [newChapter("들어가며")],
  };
}

// ── Chapter operations ───────────────────────────────────────────────────────

export function splitChapter(chapters: Chapter[], chapterId: string, blockIndex: number): Chapter[] {
  const idx = chapters.findIndex((c) => c.id === chapterId);
  if (idx === -1 || blockIndex <= 0) return chapters;
  const ch = chapters[idx];
  const before = ch.blocks.slice(0, blockIndex);
  const after = ch.blocks.slice(blockIndex);
  const newCh: Chapter = {
    id: uid(),
    title: after[0]?.type === "h2" || after[0]?.type === "h3"
      ? (after[0] as TextBlock).html.replace(/<[^>]+>/g, "").trim() || "새 챕터"
      : "새 챕터",
    blocks: after.length > 0 ? after : [{ id: uid(), type: "paragraph", html: "" }],
    collapsed: false,
  };
  const updated = [...chapters];
  updated[idx] = { ...ch, blocks: before.length > 0 ? before : [{ id: uid(), type: "paragraph", html: "" }] };
  updated.splice(idx + 1, 0, newCh);
  return updated;
}

export function mergeChapters(chapters: Chapter[], chapterId: string): Chapter[] {
  const idx = chapters.findIndex((c) => c.id === chapterId);
  if (idx <= 0) return chapters;
  const prev = chapters[idx - 1];
  const curr = chapters[idx];
  const merged: Chapter = {
    ...prev,
    blocks: [...prev.blocks, ...curr.blocks],
  };
  const updated = [...chapters];
  updated.splice(idx - 1, 2, merged);
  return updated;
}
