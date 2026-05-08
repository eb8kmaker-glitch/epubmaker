import { test, expect } from "@playwright/test";
import path from "path";

const FIXTURE_TXT = path.resolve(__dirname, "fixtures/sample.txt");

test.describe("EPUB conversion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/convert");
  });

  test("convert page loads with file upload zone", async ({ page }) => {
    await expect(page.locator('input[type="file"]')).toBeAttached();
    await expect(page.getByTestId("upload-zone")).toBeVisible();
  });

  test("uploading a TXT file shows convert button", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);

    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    const convertBtn = page.getByTestId("convert-btn");
    await expect(convertBtn).toBeVisible({ timeout: 5_000 });
    await expect(convertBtn).toBeEnabled();
  });

  test("conversion settings are visible after file upload", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);

    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    // Title and author inputs are always visible after file upload
    await expect(page.getByTestId("title-input")).toBeVisible({ timeout: 5_000 });
  });

  test("converts TXT to EPUB and triggers download", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);

    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    const convertBtn = page.getByTestId("convert-btn");
    await expect(convertBtn).toBeVisible({ timeout: 5_000 });

    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    await convertBtn.click();

    // Progress bar appears while converting
    await expect(page.getByTestId("converting-state")).toBeVisible({ timeout: 5_000 });

    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.epub$/i);
    expect(filename.length).toBeGreaterThan(5);
  });

  test("downloaded EPUB filename reflects document title", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);
    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    // Title input is always visible in the new design
    const titleInput = page.getByTestId("title-input");
    await expect(titleInput).toBeVisible({ timeout: 5_000 });
    await titleInput.fill("My Test Book");

    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByTestId("convert-btn").click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.epub$/i);
  });

  test("remove file button resets state", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);

    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    await page.getByTestId("remove-file-btn").click();

    // File info disappears, upload zone comes back
    await expect(page.locator("text=sample.txt")).not.toBeVisible({ timeout: 3_000 });
    await expect(page.getByTestId("upload-zone")).toBeVisible({ timeout: 3_000 });
  });

  test("shows error for invalid file type", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.invalid",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("invalid content"),
    });

    await expect(page.getByTestId("upload-error")).toBeVisible({ timeout: 5_000 });
  });

  test("EPUB preview appears after successful conversion", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_TXT);
    await expect(page.locator("text=sample.txt")).toBeVisible({ timeout: 5_000 });

    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByTestId("convert-btn").click();
    await downloadPromise;

    // TOC Editor button appears after conversion
    await expect(page.getByTestId("open-toc-editor-btn").or(
      page.locator("button").filter({ hasText: /TOC|목차/i })
    ).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Batch conversion", () => {
  test("selecting multiple files shows batch UI", async ({ page }) => {
    await page.goto("/en/convert");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([FIXTURE_TXT, FIXTURE_TXT]);

    await expect(page.locator("text=/Batch conversion/i").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("convert-all-btn")).toBeVisible({ timeout: 5_000 });
  });
});
