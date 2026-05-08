import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // next-intl redirects / → /en (trailing slash not guaranteed)
    await page.waitForURL(/\/en/);
  });

  test("loads without error", async ({ page }) => {
    await expect(page).toHaveTitle(/EPUBMaker/i);
    // No 404 / 500 error overlay
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("hero section is visible", async ({ page }) => {
    // Hero section exists
    const hero = page.locator("section, div").filter({ hasText: /Write beautifully|Create EPUBs/i }).first();
    await expect(hero).toBeVisible();
  });

  test("CTA button links to /convert", async ({ page }) => {
    // At least one primary CTA links to /convert or /en/convert
    const ctaLinks = page.locator('a[href*="/convert"]');
    await expect(ctaLinks.first()).toBeVisible();
  });

  test("navbar has Convert link", async ({ page }) => {
    const convertLink = page.locator("header nav a").filter({ hasText: /Convert|변환/i });
    await expect(convertLink).toBeVisible();
  });

  test("no login or signup buttons visible", async ({ page }) => {
    // Auth buttons must not exist
    await expect(page.locator("a, button").filter({ hasText: /^Log in$|^Sign in$|^Sign up$|^로그인$|^회원가입$/i })).toHaveCount(0);
  });

  test("footer has Terms and Privacy links", async ({ page }) => {
    await expect(page.locator("footer a").filter({ hasText: /Terms|이용약관/i })).toBeVisible();
    await expect(page.locator("footer a").filter({ hasText: /Privacy|개인정보/i })).toBeVisible();
  });

  test("footer has Service Update link to /announcement", async ({ page }) => {
    const announcementLink = page.locator("footer a").filter({ hasText: /Service Update|서비스 안내|Serviceankündigung|Anuncio|Annonce|お知らせ|公告|Aviso/i });
    await expect(announcementLink).toBeVisible();
    const href = await announcementLink.getAttribute("href");
    expect(href).toMatch(/announcement/);
  });

  test("How It Works section is visible", async ({ page }) => {
    await expect(page.locator("h2").filter({ hasText: /How It Works|이용 방법/i })).toBeVisible();
  });

  test("Features section is visible", async ({ page }) => {
    await expect(page.locator("h2").filter({ hasText: /Features|기능/i })).toBeVisible();
  });
});
