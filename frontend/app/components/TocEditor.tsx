"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import JSZip from "jszip";

interface TocItem {
  id: string;
  label: string;
  href: string;
  depth: number;
}

type NavFormat = "nav" | "ncx";

interface LoadedEpub {
  zip: JSZip;
  navPath: string;
  navFormat: NavFormat;
  items: TocItem[];
}

interface TocEditorProps {
  epubBlob: Blob;
  filename: string;
  onClose: () => void;
}

// ── NAV.XHTML 파서 ──────────────────────────────────────────────────────────

function parseNavXhtml(content: string): TocItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const navEl =
    doc.querySelector('nav[epub\\:type="toc"]') ||
    doc.querySelector('nav[role="doc-toc"]') ||
    doc.querySelector("nav");
  if (!navEl) return [];

  const items: TocItem[] = [];
  let idCounter = 0;

  function parseOl(ol: Element, depth: number) {
    for (const child of ol.children) {
      const tag = child.tagName.toLowerCase();
      if (tag !== "li") continue;
      const a = child.querySelector("a");
      if (a) {
        items.push({
          id: `toc-${idCounter++}`,
          label: a.textContent?.trim() ?? "",
          href: a.getAttribute("href") ?? "",
          depth,
        });
      }
      const nestedOl = child.querySelector("ol");
      if (nestedOl) parseOl(nestedOl, depth + 1);
    }
  }

  const ol = navEl.querySelector("ol");
  if (ol) parseOl(ol, 0);
  return items;
}

// ── NCX 파서 ────────────────────────────────────────────────────────────────

function parseNcx(content: string): TocItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "application/xml");
  const navMap = doc.querySelector("navMap");
  if (!navMap) return [];

  const items: TocItem[] = [];
  let idCounter = 0;

  function parseNavPoints(parent: Element, depth: number) {
    for (const child of parent.children) {
      if (child.tagName.replace(/.*:/, "") !== "navPoint") continue;
      const labelEl = child.querySelector("navLabel > text, text");
      const contentEl = child.querySelector("content");
      items.push({
        id: `toc-${idCounter++}`,
        label: labelEl?.textContent?.trim() ?? "",
        href: contentEl?.getAttribute("src") ?? "",
        depth,
      });
      parseNavPoints(child, depth + 1);
    }
  }

  parseNavPoints(navMap, 0);
  return items;
}

// ── NAV 재생성 ───────────────────────────────────────────────────────────────

function buildNestedOl(doc: Document, items: TocItem[], startIdx: number, depth: number): { el: Element; nextIdx: number } {
  const ol = doc.createElement("ol");
  let i = startIdx;
  while (i < items.length) {
    const item = items[i];
    if (item.depth < depth) break;
    if (item.depth > depth) { i++; continue; }

    const li = doc.createElement("li");
    const a = doc.createElement("a");
    a.setAttribute("href", item.href);
    a.textContent = item.label;
    li.appendChild(a);

    if (i + 1 < items.length && items[i + 1].depth > depth) {
      const nested = buildNestedOl(doc, items, i + 1, items[i + 1].depth);
      li.appendChild(nested.el);
      i = nested.nextIdx;
    } else {
      i++;
    }
    ol.appendChild(li);
  }
  return { el: ol, nextIdx: i };
}

function updateNavXhtml(originalContent: string, items: TocItem[]): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalContent, "application/xhtml+xml");

  const navEl =
    doc.querySelector('nav[epub\\:type="toc"]') ||
    doc.querySelector('nav[role="doc-toc"]') ||
    doc.querySelector("nav");

  if (!navEl) return originalContent;

  const existingOl = navEl.querySelector("ol");
  if (existingOl) navEl.removeChild(existingOl);

  const minDepth = items.length > 0 ? Math.min(...items.map((i) => i.depth)) : 0;
  const { el: newOl } = buildNestedOl(doc, items, 0, minDepth);
  navEl.appendChild(newOl);

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

function updateNcx(originalContent: string, items: TocItem[]): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalContent, "application/xml");
  const navMap = doc.querySelector("navMap");
  if (!navMap) return originalContent;

  while (navMap.firstChild) navMap.removeChild(navMap.firstChild);

  items.forEach((item, idx) => {
    const np = doc.createElement("navPoint");
    np.setAttribute("id", `np${idx + 1}`);
    np.setAttribute("playOrder", String(idx + 1));
    const label = doc.createElement("navLabel");
    const text = doc.createElement("text");
    text.textContent = item.label;
    label.appendChild(text);
    const content = doc.createElement("content");
    content.setAttribute("src", item.href);
    np.appendChild(label);
    np.appendChild(content);
    navMap.appendChild(np);
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function TocEditor({ epubBlob, filename, onClose }: TocEditorProps) {
  const t = useTranslations("TocEditor");

  const [loaded, setLoaded] = useState<LoadedEpub | null>(null);
  const [items, setItems] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noNav, setNoNav] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const zip = await JSZip.loadAsync(epubBlob);

        const containerFile = zip.file("META-INF/container.xml");
        if (!containerFile) throw new Error("Not a valid EPUB: missing META-INF/container.xml");
        const containerXml = await containerFile.async("text");
        const opfMatch = containerXml.match(/full-path="([^"]+)"/);
        if (!opfMatch) throw new Error("Cannot find OPF path");
        const opfPath = opfMatch[1];
        const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

        const opfFile = zip.file(opfPath);
        if (!opfFile) throw new Error("OPF file not found");
        const opfContent = await opfFile.async("text");

        let navRelPath: string | null = null;
        let navFormat: NavFormat = "nav";
        let ncxPath: string | null = null;

        const itemRegex = /<item\b([^>]*?)(?:\/>|>)/gi;
        let itemMatch: RegExpExecArray | null;
        while ((itemMatch = itemRegex.exec(opfContent)) !== null) {
          const attrs = itemMatch[1];
          const hrefMatch = attrs.match(/href="([^"]+)"/);
          if (!hrefMatch) continue;
          const href = hrefMatch[1];
          const propertiesMatch = attrs.match(/properties="([^"]+)"/);
          const mediaTypeMatch = attrs.match(/media-type="([^"]+)"/);
          if (propertiesMatch && /\bnav\b/.test(propertiesMatch[1])) {
            navRelPath = opfDir + href;
            navFormat = "nav";
            break;
          }
          if (!ncxPath && mediaTypeMatch?.[1] === "application/x-dtbncx+xml") {
            ncxPath = opfDir + href;
          }
        }

        if (!navRelPath && ncxPath) {
          navRelPath = ncxPath;
          navFormat = "ncx";
        }

        if (!navRelPath) {
          if (!cancelled) {
            setNoNav(true);
            setLoading(false);
          }
          return;
        }

        const navFile = zip.file(navRelPath);
        if (!navFile) throw new Error(`Nav file not found: ${navRelPath}`);
        const navContent = await navFile.async("text");

        const parsedItems = navFormat === "nav" ? parseNavXhtml(navContent) : parseNcx(navContent);

        if (!cancelled) {
          setLoaded({ zip, navPath: navRelPath, navFormat, items: parsedItems });
          setItems(parsedItems);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load EPUB");
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [epubBlob]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleDragStart = useCallback((idx: number) => setDragIndex(idx), []);
  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (dragIndex === null || dragIndex === toIdx) { setDragIndex(null); return; }
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDragIndex(null);
  }, [dragIndex]);
  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const startEdit = useCallback((item: TocItem) => {
    setEditingId(item.id);
    setEditingLabel(item.label);
  }, []);
  const commitEdit = useCallback(() => {
    if (!editingId) return;
    setItems((prev) =>
      prev.map((item) => (item.id === editingId ? { ...item, label: editingLabel } : item))
    );
    setEditingId(null);
  }, [editingId, editingLabel]);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addItem = useCallback(() => {
    const minDepth = items.length > 0 ? Math.min(...items.map((i) => i.depth)) : 0;
    const newItem: TocItem = {
      id: `toc-new-${Date.now()}`,
      label: t("newChapter"),
      href: "",
      depth: minDepth,
    };
    setItems((prev) => [...prev, newItem]);
    setTimeout(() => startEdit(newItem), 0);
  }, [items, startEdit, t]);

  const adjustDepth = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, depth: Math.max(0, item.depth + delta) } : item
      )
    );
  }, []);

  const saveAndDownload = useCallback(async () => {
    if (!loaded) return;
    setSaving(true);
    try {
      const { zip, navPath, navFormat } = loaded;

      const navFile = zip.file(navPath);
      if (!navFile) throw new Error("Nav file lost");
      const originalContent = await navFile.async("text");

      const updatedContent =
        navFormat === "nav"
          ? updateNavXhtml(originalContent, items)
          : updateNcx(originalContent, items);

      zip.file(navPath, updatedContent);

      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.replace(/\.epub$/i, "") + "_edited.epub";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save EPUB");
    } finally {
      setSaving(false);
    }
  }, [loaded, items, filename]);

  // ── 렌더링 ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-[12px] border border-[var(--lib-border)] bg-[var(--lib-panel)] p-6">
        <p className="text-sm text-[var(--lib-dust)]">{t("loading")}</p>
      </div>
    );
  }

  if (noNav) {
    return (
      <div className="rounded-[12px] border border-[var(--lib-border)] bg-[var(--lib-panel)] p-4 text-sm text-[var(--lib-dust)]">
        <p className="font-medium text-[var(--lib-ink)]">{t("noNavTitle")}</p>
        <p className="mt-1">{t("noNavDesc")}</p>
        <p className="mt-1 text-xs">{t("noNavHint")}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 underline underline-offset-2 hover:text-[var(--lib-wood-dim)]"
        >
          {t("close")}
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">{t("errorTitle")}</p>
        <p className="mt-1">{error}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 underline underline-offset-2"
        >
          {t("close")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[var(--lib-border)] bg-[var(--lib-panel)] p-4">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--lib-ink)]">{t("title")}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-[var(--lib-dust)] underline underline-offset-2 hover:text-[var(--lib-wood-dim)]"
        >
          {t("close")}
        </button>
      </div>

      <p className="mb-3 text-xs text-[var(--lib-dust)]">
        {t("instructions")}
      </p>

      {items.length === 0 ? (
        <p className="rounded-lg bg-[var(--lib-bg-2)] px-4 py-3 text-sm text-[var(--lib-dust)]">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, idx) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              style={{ paddingLeft: `${item.depth * 20}px` }}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                dragOverIndex === idx && dragIndex !== idx
                  ? "bg-[var(--lib-wood-dim)]/10 outline outline-2 outline-[var(--lib-wood-dim)]"
                  : "bg-[var(--lib-bg-2)]"
              } ${dragIndex === idx ? "opacity-40" : ""}`}
            >
              {/* 드래그 핸들 */}
              <span
                className="shrink-0 cursor-grab text-[var(--lib-dust)] active:cursor-grabbing"
                title={t("dragHandle")}
                aria-hidden
              >
                ⠿
              </span>

              {/* 들여쓰기 버튼 */}
              <button
                type="button"
                onClick={() => adjustDepth(item.id, -1)}
                disabled={item.depth === 0}
                className="shrink-0 rounded px-1 text-xs text-[var(--lib-dust)] hover:bg-[var(--lib-border)] disabled:opacity-30"
                title={t("outdent")}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => adjustDepth(item.id, 1)}
                className="shrink-0 rounded px-1 text-xs text-[var(--lib-dust)] hover:bg-[var(--lib-border)]"
                title={t("indent")}
              >
                →
              </button>

              {/* 레이블 (인라인 편집) */}
              {editingId === item.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="min-w-0 flex-1 rounded border border-[var(--lib-wood-light)] bg-[var(--lib-panel)] px-2 py-0.5 text-sm text-[var(--lib-ink)] focus:outline-none"
                />
              ) : (
                <span
                  className="min-w-0 flex-1 cursor-pointer truncate text-sm text-[var(--lib-ink)] hover:underline"
                  onClick={() => startEdit(item)}
                  title={t("clickToEdit")}
                >
                  {item.label || <span className="italic text-[var(--lib-dust)]">{t("noLabel")}</span>}
                </span>
              )}

              {/* href 표시 (짧게) */}
              {item.href && (
                <span className="hidden shrink-0 max-w-[80px] truncate font-mono text-[10px] text-[var(--lib-dust)] sm:block" title={item.href}>
                  {item.href}
                </span>
              )}

              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                className="shrink-0 rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                title="✕"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 액션 버튼 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addItem}
          className="rounded-xl border border-[var(--lib-border)] bg-[var(--lib-panel)] px-3 py-1.5 text-sm font-medium text-[var(--lib-ink)] hover:bg-[var(--lib-bg-2)]"
        >
          {t("addItem")}
        </button>
        <button
          type="button"
          onClick={saveAndDownload}
          disabled={saving}
          className="rounded-xl bg-[var(--lib-wood-dim)] px-4 py-1.5 text-sm font-medium text-[#F8F5F0] hover:bg-[var(--lib-wood)] disabled:opacity-50"
        >
          {saving ? t("saving") : t("saveAndDownload")}
        </button>
        <button
          type="button"
          onClick={() => setItems(loaded?.items ?? [])}
          className="text-xs text-[var(--lib-dust)] underline underline-offset-2 hover:text-[var(--lib-wood-dim)]"
        >
          {t("reset")}
        </button>
      </div>
    </div>
  );
}
