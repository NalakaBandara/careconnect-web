import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Playwright does not read .env.local the way Next does, so the test account
// credentials are loaded here. Parsed rather than pulling in a dependency for
// four lines.
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // A failing assertion is usually a real failure, not a slow machine, so the
  // default timeouts are left alone rather than raised to hide flakiness.
  fullyParallel: true,
  // Stops a stray .only committed by accident from silently skipping the suite.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Capped. The API allows 30 requests a minute per IP, and the booking page
  // alone makes about ten of them, because availability is one request per
  // working day. Eight workers loading pages at once spent that budget in
  // seconds and the tests then reported empty results and full diaries, which
  // looked like application bugs. The real fix is a single availability request
  // covering a date range; until the API offers one, the suite paces itself.
  workers: 3,
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
  //
  // Journey tests create real records on the shared API, so they run at one
  // size only. Running them three times over would book the same slot three
  // times and race with themselves. The tablet and mobile projects therefore
  // run the layout checks alone, which is all they are for.
  projects: [
    // Signs in once and saves the session for the rest to reuse. The API rate
    // limits authentication (5 registrations an hour, 10 logins per 15
    // minutes), so signing in inside each test burns the budget and then
    // fails with 429s that look like application bugs.
    { name: "setup", testMatch: /auth\.setup\.ts/ },

    {
      name: "desktop",
      // Everything except the setup file, which is the setup project's job and
      // would otherwise be run twice.
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "tablet",
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices["iPad Mini"], browserName: "chromium" },
    },
    {
      name: "mobile",
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices["iPhone SE"], browserName: "chromium" },
    },
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
