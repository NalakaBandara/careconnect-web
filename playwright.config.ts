import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // A failing assertion is usually a real failure, not a slow machine, so the
  // default timeouts are left alone rather than raised to hide flakiness.
  fullyParallel: true,
  // Stops a stray .only committed by accident from silently skipping the suite.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    // Only kept for a failure, so a passing run leaves nothing behind.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  // The iPhone and iPad presets default to WebKit, Safari's engine. These
  // tests are about layout at a given width, which the engine barely affects,
  // so they run in Chromium and only the viewport and touch settings are
  // borrowed. Installing WebKit as well would be worth it for testing actual
  // Safari behaviour, which is a different job.
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "tablet", use: { ...devices["iPad Mini"], browserName: "chromium" } },
    { name: "mobile", use: { ...devices["iPhone SE"], browserName: "chromium" } },
  ],

  // Starts the dev server if it is not already running, and reuses one that
  // is, so running the tests never costs a cold start twice.
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
