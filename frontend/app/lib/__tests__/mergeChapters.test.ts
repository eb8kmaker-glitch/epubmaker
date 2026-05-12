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

  it("merges curr blocks into prev", () => {
    const a = chapter("A", [para("내용 A")]);
    const b = chapter("B", [para("내용 B")]);
    const result = mergeChapters([a, b], b.id);

    assert.equal(result.length, 1);
    assert.equal(result[0].id, a.id, "merged chapter keeps prev id");
    assert.equal(result[0].title, "A", "merged chapter keeps prev title");
    assert.equal(result[0].blocks.length, 2);
    assert.equal((result[0].blocks[0] as TextBlock).html, "내용 A");
    assert.equal((result[0].blocks[1] as TextBlock).html, "내용 B");
  });

  it("block order is preserved: prev blocks come before curr blocks", () => {
    const a = chapter("A", [para("A1"), para("A2")]);
    const b = chapter("B", [para("B1"), para("B2"), para("B3")]);
    const [merged] = mergeChapters([a, b], b.id);

    const htmls = (merged.blocks as TextBlock[]).map((bl) => bl.html);
    assert.deepEqual(htmls, ["A1", "A2", "B1", "B2", "B3"]);
  });

  it("strips sole empty placeholder from prev before merge", () => {
    const a = emptyChapter("A");           // only default empty block
    const b = chapter("B", [para("내용 B")]);
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.blocks.length, 1, "no ghost empty block at top");
    assert.equal((merged.blocks[0] as TextBlock).html, "내용 B");
  });

  it("strips sole empty placeholder from curr before merge", () => {
    const a = chapter("A", [para("내용 A")]);
    const b = emptyChapter("B");
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.blocks.length, 1);
    assert.equal((merged.blocks[0] as TextBlock).html, "내용 A");
  });

  it("both chapters empty → result has exactly one empty block", () => {
    const a = emptyChapter("A");
    const b = emptyChapter("B");
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.blocks.length, 1);
    assert.equal((merged.blocks[0] as TextBlock).html, "");
  });

  it("preserves image blocks without data loss", () => {
    const image = img("blob:photo");
    const a = chapter("A", [para("text")]);
    const b = chapter("B", [image, para("caption text")]);
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.blocks.length, 3);
    assert.equal(merged.blocks[1].type, "image");
    assert.equal((merged.blocks[1] as ImageBlock).src, "blob:photo");
  });

  it("does not merge first chapter (idx === 0)", () => {
    const a = chapter("A", [para("A")]);
    const b = chapter("B", [para("B")]);
    const original = [a, b];
    const result = mergeChapters(original, a.id); // try to merge first chapter

    assert.deepEqual(result, original, "returned unchanged when idx === 0");
  });

  it("merges middle chapter correctly, leaving surrounding chapters intact", () => {
    const a = chapter("A", [para("A")]);
    const b = chapter("B", [para("B")]);
    const c = chapter("C", [para("C")]);

    const result = mergeChapters([a, b, c], b.id); // merge B into A

    assert.equal(result.length, 2);
    assert.equal(result[0].title, "A");
    assert.equal(result[0].blocks.length, 2);
    assert.equal(result[1].id, c.id, "chapter C untouched");
  });

  it("consecutive merges: A + B + C reduces to single chapter", () => {
    const a = chapter("A", [para("A")]);
    const b = chapter("B", [para("B")]);
    const c = chapter("C", [para("C")]);

    const step1 = mergeChapters([a, b, c], c.id); // C into B → [A, B+C]
    assert.equal(step1.length, 2);

    const step2 = mergeChapters(step1, step1[1].id); // B+C into A → [A+B+C]
    assert.equal(step2.length, 1);
    assert.equal(step2[0].blocks.length, 3);
    const htmls = (step2[0].blocks as TextBlock[]).map((bl) => bl.html);
    assert.deepEqual(htmls, ["A", "B", "C"]);
  });

  it("heading blocks are preserved without duplication", () => {
    const a = chapter("A", [para("intro")]);
    const b = chapter("B", [h2("Section"), para("body")]);
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.blocks.length, 3);
    assert.equal(merged.blocks[1].type, "h2");
    assert.equal((merged.blocks[1] as TextBlock).html, "Section");
  });

  it("merged chapter keeps prev chapter id (for focus stability)", () => {
    const a = chapter("A", [para("A")]);
    const b = chapter("B", [para("B")]);
    const [merged] = mergeChapters([a, b], b.id);

    assert.equal(merged.id, a.id);
  });

  it("unknown chapterId returns chapters unchanged", () => {
    const a = chapter("A", [para("A")]);
    const result = mergeChapters([a], "nonexistent-id");
    assert.deepEqual(result, [a]);
  });
});
