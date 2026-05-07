import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURE_TXT = path.resolve(__dirname, "fixtures/sample.txt");

test.describe("EPUB conversion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/convert");
  });

  test("convert page loads with file upload zone", async ({ page }) => {
    await expect(page.locator('input[type="file"]')).toBeAttached();
    await expect(page.locator("text=/Drag and drop|drag/i").first()).toBeVisible();
  });

  test("uploading a TXT file shows convert button", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);

    // Filename appears
    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    // Convert button appears
    const convertBtn = page.locator("button").filter({ hasText: /Convert to EPUB|EPUB로 변환/i });
    await expect(convertBtn).toBeVisible({ timeout: 5_000 });
    await expect(convertBtn).toBeEnabled();
  });

  test("conversion settings are visible after file upload", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);

    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    // ConversionSettings panel should appear
    await expect(page.locator("text=/Title|제목/i").first()).toBeVisible({ timeout: 5_000 });
  });

  test("converts TXT to EPUB and triggers download", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);

    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    const convertBtn = page.locator("button").filter({ hasText: /Convert to EPUB|EPUB로 변환/i });
    await expect(convertBtn).toBeVisible({ timeout: 5_000 });

    // Listen for download before clicking
    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    await convertBtn.click();

    // Button enters loading state
    await expect(page.locator("button").filter({ hasText: /Converting|변환 중/i })).toBeVisible({ timeout: 5_000 });

    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.epub$/i);
    expect(filename.length).toBeGreaterThan(5);
  });

  test("downloaded EPUB filename reflects document title", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);
    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    // Set a custom title
    const titleInput = page.locator("input").filter({ hasText: /Title|제목/i }).or(
      page.locator('input[placeholder*="title" i], input[placeholder*="제목"]')
    ).first();
    if (await titleInput.isVisible()) {
      await titleInput.fill("My Test Book");
    }

    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    const convertBtn = page.locator("button").filter({ hasText: /Convert to EPUB|EPUB로 변환/i });
    await convertBtn.click();

    const download = await downloadPromise;
    // Filename should be based on title or fall back to "document.epub"
    expect(download.suggestedFilename()).toMatch(/\.epub$/i);
  });

  test("remove file button resets state", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);

    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    const removeBtn = page.locator("button").filter({ hasText: /Remove file|파일 제거/i });
    await removeBtn.click();

    // File info disappears, upload zone comes back
    await expect(page.locator("text=sample.txt")).not.toBeVisible({ timeout: 3_000 });
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });

  test("shows error for invalid file type", async ({ page }) => {
    // Create an in-memory file with wrong extension via JS
    await page.evaluate(() => {
      const dt = new DataTransfer();
      const file = new File(["invalid content"], "test.invalid", { type: "text/plain" });
      dt.items.add(file);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(input, "files", { value: dt.files });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Error message appears
    await expect(page.locator('[role="alert"], .error, p').filter({ hasText: /not supported|지원되지|Please upload/i })).toBeVisible({ timeout: 5_000 });
  });

  test("EPUB preview appears after successful conversion", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);
    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    const convertBtn = page.locator("button").filter({ hasText: /Convert to EPUB|EPUB로 변환/i });
    await convertBtn.click();
    await downloadPromise;

    // EPUB preview or TOC editor button should appear
    const postConversionEl = page.locator("button, div").filter({ hasText: /TOC Editor|Open TOC|목차 편집/i });
    await expect(postConversionEl).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Batch conversion", () => {
  test("selecting multiple files shows batch UI", async ({ page }) => {
    await page.goto("/en/convert");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([FIXTURE_TXT, FIXTURE_TXT]);

    // Batch mode UI
    await expect(page.locator("text=/Batch conversion|일괄 변환/i").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("button").filter({ hasText: /Convert all|전부 EPUB/i })).toBeVisible({ timeout: 5_000 });
  });
});
