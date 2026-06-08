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
  src: string;      // object URL or data URL (for display)
  alt: string;
  caption: string;
  fileBlob?: Blob;  // actual file data for EPUB embedding
  align?: "full" | "left" | "right" | "inline-left" | "inline-right"; // image placement (default: full)
  sideText?: string; // text in the adjacent column (inline-left / inline-right only)
}

export type Block = TextBlock | ImageBlock;

export interface CoverImage {
  blob: Blob;       // actual image file data for EPUB embedding
  mimeType: string; // image/jpeg | image/png
  name: string;     // original filename (display only)
}

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
  coverImage?: CoverImage | null; // uploaded cover, embedded as cover.xhtml + OPF cover-image
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
    coverImage: null,
  };
}

export function newChapter(title = ""): Chapter {
  return {
    id: uid(),
    title,
    blocks: [{ id: uid(), type: "paragraph", html: "" }],
    collapsed: false,
  };
}

export function emptyBook(firstChapterTitle = ""): BookModel {
  return {
    meta: defaultMeta(),
    chapters: [newChapter(firstChapterTitle)],
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
      ? (after[0] as TextBlock).html.replace(/<[^>]+>/g, "").trim()
      : "",
    blocks: after.length > 0 ? after : [{ id: uid(), type: "paragraph", html: "" }],
    collapsed: false,
  };
  const updated = [...chapters];
  updated[idx] = { ...ch, blocks: before.length > 0 ? before : [{ id: uid(), type: "paragraph", html: "" }] };
  updated.splice(idx + 1, 0, newCh);
  return updated;
}

// Titles that carry no semantic meaning and should not become heading blocks.
const PLACEHOLDER_TITLES = new Set(["", "새 챕터", "제목 없음"]);

export function mergeChapters(chapters: Chapter[], chapterId: string): Chapter[] {
  const idx = chapters.findIndex((c) => c.id === chapterId);
  if (idx <= 0) return chapters;
  const prev = chapters[idx - 1];
  const curr = chapters[idx];

  // Strip the sole default-empty placeholder so it doesn't bleed into the merged content.
  const isDefaultEmpty = (b: Block) =>
    b.type === "paragraph" && (b as TextBlock).html === "";
  const prevBlocks =
    prev.blocks.length === 1 && isDefaultEmpty(prev.blocks[0]) ? [] : prev.blocks;
  const currBlocks =
    curr.blocks.length === 1 && isDefaultEmpty(curr.blocks[0]) ? [] : curr.blocks;

  // Convert curr.title to an h2 block so the chapter heading is preserved visually.
  // Skip if the title is empty/placeholder, or if the first block already IS that heading
  // (split-then-merge round-trip should not duplicate).
  const titleText = curr.title.trim();
  const firstIsMatchingH2 =
    currBlocks.length > 0 &&
    currBlocks[0].type === "h2" &&
    (currBlocks[0] as TextBlock).html === titleText;
  const titleBlock: TextBlock | null =
    !PLACEHOLDER_TITLES.has(titleText) && !firstIsMatchingH2
      ? { id: uid(), type: "h2", html: titleText }
      : null;

  const mergedBlocks = [
    ...prevBlocks,
    ...(titleBlock ? [titleBlock] : []),
    ...currBlocks,
  ];

  const merged: Chapter = {
    ...prev,
    blocks: mergedBlocks.length > 0
      ? mergedBlocks
      : [{ id: uid(), type: "paragraph", html: "" }],
  };
  const updated = [...chapters];
  updated.splice(idx - 1, 2, merged);
  return updated;
}
