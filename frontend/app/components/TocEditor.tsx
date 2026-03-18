"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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

  // 기존 ol 제거 후 새 ol 삽입
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

  // 기존 navPoint 모두 제거
  while (navMap.firstChild) navMap.removeChild(navMap.firstChild);

  // 새 navPoints 생성 (flat — depth 무시하고 순서만 유지)
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
  const [loaded, setLoaded] = useState<LoadedEpub | null>(null);
  const [items, setItems] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // EPUB 로딩
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const zip = await JSZip.loadAsync(epubBlob);

        // container.xml → OPF 경로
        const containerFile = zip.file("META-INF/container.xml");
        if (!containerFile) throw new Error("Not a valid EPUB: missing META-INF/container.xml");
        const containerXml = await containerFile.async("text");
        const opfMatch = containerXml.match(/full-path="([^"]+)"/);
        if (!opfMatch) throw new Error("Cannot find OPF path");
        const opfPath = opfMatch[1];
        const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

        // OPF 읽기
        const opfFile = zip.file(opfPath);
        if (!opfFile) throw new Error("OPF file not found");
        const opfContent = await opfFile.async("text");

        // nav 문서 찾기 (EPUB3 우선)
        let navRelPath: string | null = null;
        let navFormat: NavFormat = "nav";

        const navItemMatch = opfContent.match(/<item[^>]+properties="[^"]*\bnav\b[^"]*"[^>]+href="([^"]+)"/);
        if (navItemMatch) {
          navRelPath = opfDir + navItemMatch[1];
          navFormat = "nav";
        } else {
          const ncxMatch = opfContent.match(/<item[^>]+media-type="application\/x-dtbncx\+xml"[^>]+href="([^"]+)"/);
          if (ncxMatch) {
            navRelPath = opfDir + ncxMatch[1];
            navFormat = "ncx";
          }
        }

        if (!navRelPath) throw new Error("Navigation document not found in EPUB");

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

  // 인라인 편집 포커스
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // 드래그앤드롭
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

  // 인라인 편집
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

  // 항목 삭제
  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // 항목 추가
  const addItem = useCallback(() => {
    const minDepth = items.length > 0 ? Math.min(...items.map((i) => i.depth)) : 0;
    const newItem: TocItem = {
      id: `toc-new-${Date.now()}`,
      label: "New Chapter",
      href: "",
      depth: minDepth,
    };
    setItems((prev) => [...prev, newItem]);
    setTimeout(() => startEdit(newItem), 0);
  }, [items, startEdit]);

  // 깊이 조절
  const adjustDepth = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, depth: Math.max(0, item.depth + delta) } : item
      )
    );
  }, []);

  // 저장 후 다운로드
  const saveAndDownload = useCallback(async () => {
    if (!loaded) return;
    setSaving(true);
    try {
      const { zip, navPath, navFormat } = loaded;

      // 원본 nav 내용 가져오기
      const navFile = zip.file(navPath);
      if (!navFile) throw new Error("Nav file lost");
      const originalContent = await navFile.async("text");

      // 업데이트된 nav 내용 생성
      const updatedContent =
        navFormat === "nav"
          ? updateNavXhtml(originalContent, items)
          : updateNcx(originalContent, items);

      // ZIP 업데이트
      zip.file(navPath, updatedContent);

      // 다운로드
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
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
        <p className="text-sm text-[var(--content-muted)]">목차 로딩 중…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">목차 편집기 오류</p>
        <p className="mt-1">{error}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 underline underline-offset-2"
        >
          닫기
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)]">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--content)]">목차 편집기</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-[var(--content-muted)] underline underline-offset-2 hover:text-[var(--primary)]"
        >
          닫기
        </button>
      </div>

      <p className="mb-3 text-xs text-[var(--content-muted)]">
        드래그하여 순서 변경 · 클릭하여 이름 수정 · 들여쓰기/내어쓰기로 계층 조정
      </p>

      {items.length === 0 ? (
        <p className="rounded-lg bg-[var(--secondary-bg)] px-4 py-3 text-sm text-[var(--content-muted)]">
          목차 항목이 없습니다.
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
                  ? "bg-[var(--primary)]/10 outline outline-2 outline-[var(--primary)]"
                  : "bg-[var(--secondary-bg)]"
              } ${dragIndex === idx ? "opacity-40" : ""}`}
            >
              {/* 드래그 핸들 */}
              <span
                className="shrink-0 cursor-grab text-[var(--content-muted)] active:cursor-grabbing"
                title="드래그하여 이동"
                aria-hidden
              >
                ⠿
              </span>

              {/* 들여쓰기 버튼 */}
              <button
                type="button"
                onClick={() => adjustDepth(item.id, -1)}
                disabled={item.depth === 0}
                className="shrink-0 rounded px-1 text-xs text-[var(--content-muted)] hover:bg-[var(--border)] disabled:opacity-30"
                title="내어쓰기"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => adjustDepth(item.id, 1)}
                className="shrink-0 rounded px-1 text-xs text-[var(--content-muted)] hover:bg-[var(--border)]"
                title="들여쓰기"
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
                  className="min-w-0 flex-1 rounded border border-[var(--primary)] bg-[var(--card)] px-2 py-0.5 text-sm text-[var(--content)] focus:outline-none"
                />
              ) : (
                <span
                  className="min-w-0 flex-1 cursor-pointer truncate text-sm text-[var(--content)] hover:underline"
                  onClick={() => startEdit(item)}
                  title="클릭하여 이름 변경"
                >
                  {item.label || <span className="italic text-[var(--content-muted)]">(제목 없음)</span>}
                </span>
              )}

              {/* href 표시 (짧게) */}
              {item.href && (
                <span className="hidden shrink-0 max-w-[80px] truncate font-mono text-[10px] text-[var(--content-muted)] sm:block" title={item.href}>
                  {item.href}
                </span>
              )}

              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                className="shrink-0 rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                title="항목 삭제"
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
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm font-medium text-[var(--content)] hover:bg-[var(--secondary-bg)]"
        >
          + 항목 추가
        </button>
        <button
          type="button"
          onClick={saveAndDownload}
          disabled={saving}
          className="rounded-xl bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장 후 다운로드"}
        </button>
        <button
          type="button"
          onClick={() => setItems(loaded?.items ?? [])}
          className="text-xs text-[var(--content-muted)] underline underline-offset-2 hover:text-[var(--primary)]"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
