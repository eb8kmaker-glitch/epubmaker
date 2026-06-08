"use client";
// .epubproj project file format — a ZIP containing:
//   project.json   the serialized book (schema-versioned), with image bytes
//                  replaced by string references like "asset:0"
//   assets/<n>     the raw image/cover Blobs (NOT base64-inlined in JSON)
//
// Reuses the autosave serialization schema (projectSchema.ts) so the on-disk
// shape stays in lockstep with the IndexedDB shape.

import JSZip from "jszip";
import type { BookModel } from "./bookModel";
import {
  type SerializedBook, type SerializedImageBlock,
  serializeBook, deserializeBook, PROJECT_SCHEMA_VERSION,
} from "./projectSchema";

const FILE_FORMAT = "epubproj";
const JSON_ENTRY = "project.json";
const ASSET_DIR = "assets/";

export class ProjectFileError extends Error {}

interface AssetRef { ref: string; mimeType?: string }

// JSON-side shapes: Blobs are swapped for asset references.
interface JsonImageBlock extends Omit<SerializedImageBlock, "fileBlob"> {
  asset?: AssetRef;
}
interface JsonBook {
  meta: Omit<SerializedBook["meta"], "coverImage"> & {
    coverImage?: { asset: AssetRef; mimeType: string; name: string } | null;
  };
  chapters: Array<{
    id: string; title: string; collapsed: boolean;
    blocks: Array<JsonImageBlock | { id: string; type: string; html: string }>;
  }>;
}
interface ProjectJson {
  format: typeof FILE_FORMAT;
  version: number;
  title: string;
  book: JsonBook;
}

// ── Export ──────────────────────────────────────────────────────────────────

export async function exportProjectFile(book: BookModel): Promise<{ blob: Blob; filename: string }> {
  const s = serializeBook(book);
  const zip = new JSZip();
  const assets: Blob[] = [];

  const addAsset = (blob: Blob): AssetRef => {
    const idx = assets.length;
    assets.push(blob);
    return { ref: `${ASSET_DIR}${idx}`, mimeType: blob.type || undefined };
  };

  const jsonBook: JsonBook = {
    meta: {
      ...s.meta,
      coverImage: s.meta.coverImage?.blob
        ? { asset: addAsset(s.meta.coverImage.blob), mimeType: s.meta.coverImage.mimeType, name: s.meta.coverImage.name }
        : null,
    },
    chapters: s.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      collapsed: ch.collapsed,
      blocks: ch.blocks.map((b) => {
        if (b.type !== "image") return { ...b };
        const img = b as SerializedImageBlock;
        const { fileBlob, ...rest } = img;
        const jb: JsonImageBlock = { ...rest };
        if (fileBlob) jb.asset = addAsset(fileBlob);
        return jb;
      }),
    })),
  };

  const projectJson: ProjectJson = {
    format: FILE_FORMAT,
    version: PROJECT_SCHEMA_VERSION,
    title: book.meta.title?.trim() ?? "",
    book: jsonBook,
  };

  zip.file(JSON_ENTRY, JSON.stringify(projectJson));
  assets.forEach((blob, i) => zip.file(`${ASSET_DIR}${i}`, blob));

  const blob = await zip.generateAsync({ type: "blob" });
  const safeName = (book.meta.title || "project")
    .replace(/[^\w가-힣\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "project";
  return { blob, filename: `${safeName}.${FILE_FORMAT}` };
}

// ── Import ──────────────────────────────────────────────────────────────────

/** Parse an .epubproj file into a BookModel. Throws ProjectFileError on bad input. */
export async function importProjectFile(file: File | Blob): Promise<BookModel> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new ProjectFileError("not-a-zip");
  }

  const jsonEntry = zip.file(JSON_ENTRY);
  if (!jsonEntry) throw new ProjectFileError("missing-json");

  let parsed: ProjectJson;
  try {
    parsed = JSON.parse(await jsonEntry.async("string")) as ProjectJson;
  } catch {
    throw new ProjectFileError("bad-json");
  }

  if (!parsed || parsed.format !== FILE_FORMAT || !parsed.book) {
    throw new ProjectFileError("bad-format");
  }
  if (typeof parsed.version !== "number" || parsed.version > PROJECT_SCHEMA_VERSION) {
    throw new ProjectFileError("unsupported-version");
  }

  const loadAsset = async (ref: AssetRef | undefined, fallbackMime?: string): Promise<Blob | undefined> => {
    if (!ref?.ref) return undefined;
    const entry = zip.file(ref.ref);
    if (!entry) throw new ProjectFileError("missing-asset");
    const raw = await entry.async("blob");
    const mime = ref.mimeType ?? fallbackMime;
    return mime ? raw.slice(0, raw.size, mime) : raw;
  };

  const jb = parsed.book;
  let coverImage: SerializedBook["meta"]["coverImage"] = null;
  if (jb.meta.coverImage?.asset) {
    const blob = await loadAsset(jb.meta.coverImage.asset, jb.meta.coverImage.mimeType);
    if (blob) coverImage = { blob, mimeType: jb.meta.coverImage.mimeType, name: jb.meta.coverImage.name };
  }

  const chapters: SerializedBook["chapters"] = [];
  for (const ch of jb.chapters) {
    const blocks: SerializedBook["chapters"][number]["blocks"] = [];
    for (const b of ch.blocks) {
      if (b.type !== "image") {
        blocks.push({ id: b.id, type: b.type as "paragraph" | "h2" | "h3" | "quote", html: (b as { html: string }).html });
      } else {
        const ib = b as JsonImageBlock;
        const fileBlob = await loadAsset(ib.asset, ib.asset?.mimeType);
        blocks.push({
          id: ib.id, type: "image", alt: ib.alt, caption: ib.caption,
          align: ib.align, sideText: ib.sideText, src: ib.src, fileBlob,
        });
      }
    }
    chapters.push({ id: ch.id, title: ch.title, collapsed: ch.collapsed, blocks });
  }

  const serialized: SerializedBook = { meta: { ...jb.meta, coverImage }, chapters };
  return deserializeBook(serialized);
}

export function isProjectFileName(name: string): boolean {
  return name.toLowerCase().endsWith(`.${FILE_FORMAT}`);
}

export const PROJECT_FILE_EXTENSION = `.${FILE_FORMAT}`;
