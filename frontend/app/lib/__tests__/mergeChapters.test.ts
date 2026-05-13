/**
 * Unit tests for mergeChapters (and related) in bookModel.ts
 * Run with:  node --experimental-strip-types app/lib/__tests__/mergeChapters.test.ts
 * (Node 22.6+ required for --experimental-strip-types)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mergeChapters,
  splitChapter,
  type Chapter,
  type TextBlock,
  type ImageBlock,
  type Block,
  uid,
} from "../bookModel.ts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function para(html: string): TextBlock {
  return { id: uid(), type: "paragraph", html };
}
function h2(html: string): TextBlock {
  return { id: uid(), type: "h2", html };
}
function img(src = "blob:test"): ImageBlock {
  return { id: uid(), type: "image", src, alt: "img", caption: "" };
}
function chapter(title: string, blocks: Block[]): Chapter {
  return { id: uid(), title, blocks, collapsed: false };
}
function emptyChapter(title: string): Chapter {
  return chapter(title, [{ id: uid(), type: "paragraph", html: "" }]);
}

// ── mergeChapters ─────────────────────────────────────────────────────────────

describe("mergeChapters", () => {

  // ── Title-to-h2 promotion ────────────────────────────────────────────────

  it("curr title is inserted as h2 block between prev and curr content", () => {
    const a = chapter("A", [para("내용 A")]);
    const b = chapter("Chapter B", [para("내용 B")]);
    const result = mergeChapters([a, b], b.id);

    assert.equal(result.length, 1);
    assert.equal(result[0].id, a.id, "merged chapter keeps prev id");
    assert.equal(result[0].title, "A", "merged chapter keeps prev title");
    assert.equal(result[0].blocks.length, 3);
    assert.equal((result[0].blocks[0] as TextBlock).html, "내용 A");
    assert.equal(result[0].blocks[1].type, "h2",    "title becomes h2");
    assert.equal((result[0].blocks[1] as TextBlock).html, "Chapter B");
    assert.equal((result[0].blocks[2] as TextBlock).html, "내용 B");
  });

  it("placeholder title ('새 챕터') is NOT inserted as h2 block", () => {
    const a = chapter("A", [para("내용 A")]);
    const b = chapter("새 챕터", [para("내용 B")]);
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.blocks.length, 2, "no h2 for placeholder title");
    assert.equal((merged.blocks[0] as TextBlock).html, "내용 A");
    assert.equal((merged.blocks[1] as TextBlock).html, "내용 B");
  });

  it("empty curr title is NOT inserted as h2 block", () => {
    const a = chapter("A", [para("내용 A")]);
    const b = chapter("", [para("내용 B")]);
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.blocks.length, 2);
    assert.equal((merged.blocks[0] as TextBlock).html, "내용 A");
    assert.equal((merged.blocks[1] as TextBlock).html, "내용 B");
  });

  it("does not insert duplicate h2 when first curr block already matches title (split-merge round-trip)", () => {
    const a = chapter("A", [para("intro")]);
    const b = chapter("Section", [h2("Section"), para("body")]);
    const [merged] = mergeChapters([a, b], b.id);

    // "Section" appears exactly once as h2
    const h2Blocks = merged.blocks.filter((bl) => bl.type === "h2");
    assert.equal(h2Blocks.length, 1, "no duplication");
    assert.equal((h2Blocks[0] as TextBlock).html, "Section");
    assert.equal(merged.blocks.length, 3);
  });

  // ── Block ordering ────────────────────────────────────────────────────────

  it("block order: prev content → curr title h2 → curr content", () => {
    const a = chapter("A", [para("A1"), para("A2")]);
    const b = chapter("B", [para("B1"), para("B2"), para("B3")]);
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.blocks.length, 6);
    const types = merged.blocks.map((bl) => bl.type);
    assert.deepEqual(types, ["paragraph", "paragraph", "h2", "paragraph", "paragraph", "paragraph"]);
    const htmls = (merged.blocks as TextBlock[]).map((bl) => bl.html);
    assert.deepEqual(htmls, ["A1", "A2", "B", "B1", "B2", "B3"]);
  });

  // ── Empty placeholder stripping ───────────────────────────────────────────

  it("strips sole empty placeholder from prev before merge", () => {
    const a = emptyChapter("A");           // only default empty block
    const b = chapter("B", [para("내용 B")]);
    const [merged] = mergeChapters([a, b], b.id);

    // prev is empty → prevBlocks = [], title "B" → h2, then curr content
    assert.equal(merged.blocks.length, 2);
    assert.equal(merged.blocks[0].type, "h2");
    assert.equal((merged.blocks[0] as TextBlock).html, "B");
    assert.equal((merged.blocks[1] as TextBlock).html, "내용 B");
  });

  it("strips sole empty placeholder from curr before merge", () => {
    const a = chapter("A", [para("내용 A")]);
    const b = emptyChapter("B");  // empty content, but title "B" → h2
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.blocks.length, 2);
    assert.equal((merged.blocks[0] as TextBlock).html, "내용 A");
    assert.equal(merged.blocks[1].type, "h2");
    assert.equal((merged.blocks[1] as TextBlock).html, "B");
  });

  it("both chapters empty with placeholder titles → exactly one empty block", () => {
    const a = emptyChapter("새 챕터");
    const b = emptyChapter("새 챕터");
    const [merged] = mergeChapters([a, b], b.id);

    // Both titles are placeholders, both content empty → fallback empty block
    assert.equal(merged.blocks.length, 1);
    assert.equal(merged.blocks[0].type, "paragraph");
    assert.equal((merged.blocks[0] as TextBlock).html, "");
  });

  it("both chapters empty with meaningful titles → h2 from curr title only", () => {
    const a = emptyChapter("A");
    const b = emptyChapter("B");
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.blocks.length, 1);
    assert.equal(merged.blocks[0].type, "h2");
    assert.equal((merged.blocks[0] as TextBlock).html, "B");
  });

  // ── Block type preservation ───────────────────────────────────────────────

  it("preserves image blocks without data loss", () => {
    const image = img("blob:photo");
    const a = chapter("A", [para("text")]);
    const b = chapter("B", [image, para("caption text")]);
    const [merged] = mergeChapters([a, b], b.id);

    // [para(text), h2(B), image, para(caption text)]
    assert.equal(merged.blocks.length, 4);
    assert.equal(merged.blocks[0].type, "paragraph");
    assert.equal(merged.blocks[1].type, "h2");
    assert.equal(merged.blocks[2].type, "image");
    assert.equal((merged.blocks[2] as ImageBlock).src, "blob:photo");
    assert.equal(merged.blocks[3].type, "paragraph");
  });

  it("existing h2 blocks in curr content are preserved alongside title h2", () => {
    const a = chapter("A", [para("intro")]);
    const b = chapter("B", [h2("Section"), para("body")]);
    const [merged] = mergeChapters([a, b], b.id);

    // [para(intro), h2(B title), h2(Section), para(body)]
    assert.equal(merged.blocks.length, 4);
    assert.equal(merged.blocks[1].type, "h2");
    assert.equal((merged.blocks[1] as TextBlock).html, "B");
    assert.equal(merged.blocks[2].type, "h2");
    assert.equal((merged.blocks[2] as TextBlock).html, "Section");
  });

  // ── Guard conditions ──────────────────────────────────────────────────────

  it("does not merge first chapter (idx === 0)", () => {
    const a = chapter("A", [para("A")]);
    const b = chapter("B", [para("B")]);
    const original = [a, b];
    const result = mergeChapters(original, a.id);

    assert.deepEqual(result, original, "returned unchanged when idx === 0");
  });

  it("unknown chapterId returns chapters unchanged", () => {
    const a = chapter("A", [para("A")]);
    const result = mergeChapters([a], "nonexistent-id");
    assert.deepEqual(result, [a]);
  });

  // ── Multi-chapter scenarios ───────────────────────────────────────────────

  it("merges middle chapter correctly, leaving surrounding chapters intact", () => {
    const a = chapter("A", [para("A")]);
    const b = chapter("B", [para("B")]);
    const c = chapter("C", [para("C")]);

    const result = mergeChapters([a, b, c], b.id); // merge B into A

    assert.equal(result.length, 2);
    assert.equal(result[0].title, "A");
    // [para(A), h2(B), para(B)]
    assert.equal(result[0].blocks.length, 3);
    assert.equal(result[1].id, c.id, "chapter C untouched");
  });

  it("consecutive merges: A + B + C reduces to single chapter with h2 separators", () => {
    const a = chapter("A", [para("A")]);
    const b = chapter("B", [para("B")]);
    const c = chapter("C", [para("C")]);

    // step 1: merge C into B → B+C = [para(B), h2(C), para(C)]
    const step1 = mergeChapters([a, b, c], c.id);
    assert.equal(step1.length, 2);
    assert.equal(step1[1].blocks.length, 3);

    // step 2: merge B+C into A → A+B+C = [para(A), h2(B), para(B), h2(C), para(C)]
    const step2 = mergeChapters(step1, step1[1].id);
    assert.equal(step2.length, 1);
    assert.equal(step2[0].blocks.length, 5);

    const types = step2[0].blocks.map((bl) => bl.type);
    assert.deepEqual(types, ["paragraph", "h2", "paragraph", "h2", "paragraph"]);
    const htmls = (step2[0].blocks as TextBlock[]).map((bl) => bl.html);
    assert.deepEqual(htmls, ["A", "B", "B", "C", "C"]);
  });

  it("merged chapter keeps prev chapter id (for focus stability)", () => {
    const a = chapter("A", [para("A")]);
    const b = chapter("B", [para("B")]);
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.id, a.id);
  });
});
