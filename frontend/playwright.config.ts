import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Non-auth tests are fully independent — run in parallel
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  // Global timeout per test; conversion tests override with test.slow() or explicit timeout
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://localhost:3000",
    locale: "en",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
