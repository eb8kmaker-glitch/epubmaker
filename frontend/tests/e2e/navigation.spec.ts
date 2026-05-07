import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = [
  { path: "/en/convert",      label: "Convert page" },
  { path: "/en/faq",          label: "FAQ page" },
  { path: "/en/blog",         label: "Blog page" },
  { path: "/en/announcement", label: "Announcement page" },
  { path: "/en/privacy",      label: "Privacy page" },
  { path: "/en/terms",        label: "Terms page" },
  { path: "/en/refund",       label: "Refund page" },
];

const REMOVED_ROUTES = [
  "/en/login",
  "/en/signup",
  "/en/dashboard",
  "/en/account",
  "/en/subscription",
  "/en/admin",
  "/en/pricing",
];

test.describe("Public page navigation", () => {
  for (const { path, label } of PUBLIC_ROUTES) {
    test(`${label} loads without error`, async ({ page }) => {
      const response = await page.goto(path);
      // Allow redirects — final status must be 200
      expect(response?.status()).toBe(200);
      // No Next.js error overlay
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText("Internal Server Error");
    });
  }

  test("Convert page has file upload zone", async ({ page }) => {
    await page.goto("/en/convert");
    // File input exists
    await expect(page.locator('input[type="file"]')).toBeAttached();
    // Drop zone text
    await expect(page.locator("text=/Drag and drop|드래그|drag/i").first()).toBeVisible();
  });

  test("FAQ page has question list", async ({ page }) => {
    await page.goto("/en/faq");
    await expect(page.locator("h1").filter({ hasText: /FAQ|Frequently|자주/i })).toBeVisible();
    // At least one Q&A pair
    const questions = page.locator("p, h3, dt").filter({ hasText: /\?$/ });
    await expect(questions.first()).toBeVisible();
  });

  test("Announcement page has key message", async ({ page }) => {
    await page.goto("/en/announcement");
    await expect(page.locator("body")).toContainText(/EPUBMaker/i);
    await expect(page.locator("body")).toContainText(/free/i);
    // CTA button links to /convert
    await expect(page.locator("a").filter({ hasText: /Start Converting|무료로/i })).toBeVisible();
  });

  test("Navbar logo links to home", async ({ page }) => {
    await page.goto("/en/convert");
    const logo = page.locator("header a").filter({ hasText: /EPUBMaker/ }).first();
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("Navbar has Convert and FAQ links", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("header nav a").filter({ hasText: /Convert|변환/i })).toBeVisible();
    await expect(page.locator("header nav a").filter({ hasText: /FAQ/i })).toBeVisible();
  });

  test("Language switcher is present", async ({ page }) => {
    await page.goto("/en");
    // Language switcher exists (select or button)
    const switcher = page.locator("select, button").filter({ hasText: /English|한국어|language/i }).first();
    await expect(switcher).toBeVisible();
  });
});

test.describe("Removed routes return 404", () => {
  for (const path of REMOVED_ROUTES) {
    test(`${path} is not accessible`, async ({ page }) => {
      const response = await page.goto(path);
      // Should be 404 or redirect to home (not a usable page)
      const status = response?.status() ?? 0;
      const url = page.url();
      // Either 404, or redirected away from the auth page
      const isRedirectedAway = !url.includes(path.replace("/en", ""));
      expect(status === 404 || isRedirectedAway).toBe(true);
    });
  }
});

test.describe("Locale routing", () => {
  test("root / redirects to default locale", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en\//);
  });

  test("/ko/convert loads in Korean", async ({ page }) => {
    const response = await page.goto("/ko/convert");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(/변환|EPUB/);
  });

  test("/ja/announcement loads", async ({ page }) => {
    const response = await page.goto("/ja/announcement");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(/EPUBMaker/);
  });
});
