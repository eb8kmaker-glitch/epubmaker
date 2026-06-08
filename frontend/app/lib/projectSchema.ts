"use client";
// Project serialization schema — the single source of truth for turning an
// in-memory BookModel into a structured-clone-safe record and back.
//
// This module is intentionally standalone so it can be reused by the upcoming
// "export/import project file" feature. It keeps image bytes as Blobs (never
// base64) and drops ephemeral object URLs, which are regenerated on load.

import type {
  BookModel, BookMeta, Chapter, Block, TextBlock, ImageBlock,
} from "./bookModel";

export const PROJECT_SCHEMA_VERSION = 1;

export interface SerializedImageBlock {
  id: string;
  type: "image";
  alt: string;
  caption: string;
  align?: ImageBlock["align"];
  sideText?: string;
  fileBlob?: Blob;  // image bytes (structured-clone-safe)
  src?: string;     // preserved only for non-object-URL sources (data:/relative)
}

export type SerializedBlock = TextBlock | SerializedImageBlock;

export interface SerializedChapter {
  id: string;
  title: string;
  collapsed: boolean;
  blocks: SerializedBlock[];
  footnotes?: Record<string, string>;
}

export interface SerializedBook {
  meta: BookMeta;            // primitives + coverImage Blob (all clone-safe)
  chapters: SerializedChapter[];
}

/** A persisted project record (IndexedDB value / future file payload). */
export interface ProjectRecord {
  version: number;
  id: string;
  title: string;
  updatedAt: number;         // ms epoch
  book: SerializedBook;
}

// ── Serialize ─────────────────────────────────────────────────────────────────

function serializeImage(b: ImageBlock): SerializedImageBlock {
  const keepSrc = b.src && !b.src.startsWith("blob:") ? b.src : undefined;
  return {
    id: b.id,
    type: "image",
    alt: b.alt,
    caption: b.caption,
    align: b.align,
    sideText: b.sideText,
    fileBlob: b.fileBlob,
    src: keepSrc,
  };
}

export function serializeBook(book: BookModel): SerializedBook {
  return {
    meta: { ...book.meta }, // coverImage Blob kept as-is
    chapters: book.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      collapsed: ch.collapsed,
      footnotes: ch.footnotes ? { ...ch.footnotes } : undefined,
      blocks: ch.blocks.map((b): SerializedBlock =>
        b.type === "image" ? serializeImage(b as ImageBlock) : { ...(b as TextBlock) },
      ),
    })),
  };
}

// ── Deserialize ───────────────────────────────────────────────────────────────

function deserializeImage(b: SerializedImageBlock): ImageBlock {
  const src = b.fileBlob
    ? URL.createObjectURL(b.fileBlob)
    : (b.src ?? "");
  return {
    id: b.id,
    type: "image",
    src,
    alt: b.alt,
    caption: b.caption,
    align: b.align,
    sideText: b.sideText,
    fileBlob: b.fileBlob,
  };
}

export function deserializeBook(s: SerializedBook): BookModel {
  return {
    meta: { ...s.meta },
    chapters: s.chapters.map((ch): Chapter => ({
      id: ch.id,
      title: ch.title,
      collapsed: ch.collapsed,
      footnotes: ch.footnotes ? { ...ch.footnotes } : {},
      blocks: ch.blocks.map((b): Block =>
        b.type === "image" ? deserializeImage(b) : { ...(b as TextBlock) },
      ),
    })),
  };
}

/** Build a fresh project record from a book. */
export function toProjectRecord(id: string, book: BookModel): ProjectRecord {
  return {
    version: PROJECT_SCHEMA_VERSION,
    id,
    title: book.meta.title?.trim() ?? "",
    updatedAt: Date.now(),
    book: serializeBook(book),
  };
}

/** Normalize a stored record across schema versions, returning its book. */
export function readProjectBook(record: ProjectRecord): BookModel {
  // v1 is current; future versions migrate here before deserializing.
  return deserializeBook(record.book);
}
