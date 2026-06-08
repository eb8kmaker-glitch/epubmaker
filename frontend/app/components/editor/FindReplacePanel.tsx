"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { BookModel } from "@/app/lib/bookModel";
import {
  type SearchMatch, findMatches, replaceAll, replaceSingle,
} from "@/app/lib/findReplace";

interface Props {
  book: BookModel;
  onBookChange: (book: BookModel) => void;
  onNavigate: (match: SearchMatch) => void;
  onClose: () => void;
}

export default function FindReplacePanel({ book, onBookChange, onNavigate, onClose }: Props) {
  const t = useTranslations("Editor");
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [current, setCurrent] = useState(0);
  const [undoSnapshot, setUndoSnapshot] = useState<BookModel | null>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(
    () => findMatches(book, query, caseSensitive),
    [book, query, caseSensitive],
  );
  const total = matches.length;
  // Derived (never stored out of range) so we don't setState inside an effect.
  const cur = total === 0 ? 0 : Math.min(current, total - 1);

  useEffect(() => { findInputRef.current?.focus(); }, []);

  const goTo = useCallback((idx: number) => {
    if (total === 0) return;
    const next = ((idx % total) + total) % total;
    setCurrent(next);
    onNavigate(matches[next]);
  }, [total, matches, onNavigate]);

  const handleReplace = useCallback(() => {
    if (total === 0) return;
    const match = matches[cur];
    onBookChange(replaceSingle(book, match, query, replacement, caseSensitive));
    setUndoSnapshot(null);
    // Matches recompute from the new book; the clamped index lands on the next.
  }, [total, matches, cur, book, query, replacement, caseSensitive, onBookChange]);

  const handleReplaceAll = useCallback(() => {
    if (total === 0) return;
    const { book: next, count } = replaceAll(book, query, replacement, caseSensitive);
    if (count > 0) {
      setUndoSnapshot(book);
      onBookChange(next);
    }
  }, [total, book, query, replacement, caseSensitive, onBookChange]);

  const handleUndo = useCallback(() => {
    if (!undoSnapshot) return;
    onBookChange(undoSnapshot);
    setUndoSnapshot(null);
  }, [undoSnapshot, onBookChange]);

  const onQueryChange = (v: string) => {
    setQuery(v);
    setCurrent(0);
    setUndoSnapshot(null);
  };

  const wrap: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
    padding: "8px 16px",
    borderBottom: "1px solid var(--lib-border)",
    background: "var(--lib-bg-3)",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  };
  const input: React.CSSProperties = {
    padding: "6px 9px", borderRadius: 6, fontSize: 13,
    border: "1px solid var(--lib-border)", background: "var(--lib-bg)",
    color: "var(--lib-ink)", outline: "none", width: 180, boxSizing: "border-box",
  };
  const btn: React.CSSProperties = {
    padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
    border: "1px solid var(--lib-border)", background: "var(--lib-bg-2)",
    color: "var(--lib-dusk)", cursor: "pointer",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  };
  const iconBtn: React.CSSProperties = {
    ...btn, padding: "6px 8px", minWidth: 30, display: "flex",
    alignItems: "center", justifyContent: "center",
  };
  const disabled = (cond: boolean): React.CSSProperties =>
    cond ? { opacity: 0.5, cursor: "not-allowed" } : {};

  const noQuery = query.length === 0;

  return (
    <div style={wrap} role="search">
      {/* Find */}
      <input
        ref={findInputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); goTo(cur + (e.shiftKey ? -1 : 1)); }
          if (e.key === "Escape") { e.preventDefault(); onClose(); }
        }}
        placeholder={t("findPlaceholder")}
        aria-label={t("findPlaceholder")}
        style={input}
      />

      {/* Count */}
      <span style={{ fontSize: 12, color: "var(--lib-dust)", minWidth: 52, textAlign: "center" }}>
        {total === 0 ? t("noMatches") : `${cur + 1}/${total}`}
      </span>

      {/* Prev / Next */}
      <button type="button" title={t("findPrevious")} aria-label={t("findPrevious")}
        onClick={() => goTo(cur - 1)} disabled={total === 0}
        style={{ ...iconBtn, ...disabled(total === 0) }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><polyline points="18 15 12 9 6 15" /></svg>
      </button>
      <button type="button" title={t("findNext")} aria-label={t("findNext")}
        onClick={() => goTo(cur + 1)} disabled={total === 0}
        style={{ ...iconBtn, ...disabled(total === 0) }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {/* Match case */}
      <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--lib-dusk)", cursor: "pointer", marginLeft: 2 }}>
        <input type="checkbox" checked={caseSensitive}
          onChange={(e) => { setCaseSensitive(e.target.checked); setCurrent(0); setUndoSnapshot(null); }}
          style={{ width: 14, height: 14, accentColor: "var(--lib-wood-dim)" }} />
        {t("matchCase")}
      </label>

      <div style={{ width: 1, height: 22, background: "var(--lib-border)", margin: "0 2px" }} />

      {/* Replace */}
      <input
        type="text"
        value={replacement}
        onChange={(e) => setReplacement(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } }}
        placeholder={t("replacePlaceholder")}
        aria-label={t("replacePlaceholder")}
        style={input}
      />
      <button type="button" onClick={handleReplace} disabled={noQuery || total === 0}
        style={{ ...btn, ...disabled(noQuery || total === 0) }}>
        {t("replace")}
      </button>
      <button type="button" onClick={handleReplaceAll} disabled={noQuery || total === 0}
        style={{ ...btn, ...disabled(noQuery || total === 0) }}>
        {t("replaceAll")}
      </button>

      {/* Undo (only right after a Replace All) */}
      {undoSnapshot && (
        <button type="button" onClick={handleUndo}
          style={{ ...btn, color: "var(--lib-wood)", borderColor: "var(--lib-wood-dim)" }}>
          {t("undoReplaceAll")}
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* Close */}
      <button type="button" title={t("closeFind")} aria-label={t("closeFind")}
        onClick={onClose} style={iconBtn}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
