import { test, expect } from "@playwright/test";

import { ADMIN_STATE, PATIENT_STATE } from "./auth-state";

// Only the desktop project runs this file; see playwright.config.ts.
//
// Nothing here signs in. The setup project signed in once and saved the
// session, and each group below points at the saved file it needs. Signing in
// per test would spend the API's login budget (10 per 15 minutes) and then fail
// with 429s that read like application bugs.

test.describe("what a guest can reach", () => {
  // No storageState at all, so these run with no cookie: a real first visit.
  test.use({ storageState: { cookies: [], origins: [] } });

  const PUBLIC = ["/", "/professionals", "/professionals/1", "/services", "/faqs", "/contact"];

  for (const path of PUBLIC) {
    test(`a guest can open ${path}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      // Not merely a 200: the page must not have bounced to login.
      expect(page.url()).not.toContain("/login");
    });
  }

  const PRIVATE = ["/dashboard", "/dashboard/appointments", "/book/1", "/admin"];

  for (const path of PRIVATE) {
    test(`a guest is sent to login from ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);

      // The URL they wanted is remembered, so signing in does not dump them
      // back on the home page.
      expect(page.url()).toContain("next=");
    });
  }
});

test.describe("where signing in sends you", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const EMAIL = process.env.E2E_PATIENT_EMAIL ?? "";
  const PASSWORD = process.env.E2E_PATIENT_PASSWORD ?? "";

  async function signIn(page: import("@playwright/test").Page) {
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
  }

  test("back to the page they were trying to reach", async ({ page }) => {
    // Turned away from a protected page, so ?next= should bring them back to
    // it rather than dropping them on the dashboard.
    await page.goto("/dashboard/appointments");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fappointments/);

    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard\/appointments$/);
  });

  test("and never to another site, whatever ?next= says", async ({ page }) => {
    // An open redirect. The link looks like CareConnect, and is, until the
    // moment the password is typed and the user is handed to a copy of the
    // login page. So an off-site destination has to be ignored.
    await page.goto("/login?next=https://example.com/login");
    await signIn(page);

    // Wait for the redirect to land, then prove it is still this site.
    await expect(page).toHaveURL(/\/dashboard/);
    expect(new URL(page.url()).origin).toBe(new URL(test.info().project.use.baseURL!).origin);
  });

  test("nor to a protocol-relative URL, which looks like a path", async ({ page }) => {
    await page.goto("/login?next=//example.com");
    await signIn(page);

    // Wait for the redirect to land, then prove it is still this site.
    await expect(page).toHaveURL(/\/dashboard/);
    expect(new URL(page.url()).origin).toBe(new URL(test.info().project.use.baseURL!).origin);
  });
});

test.describe("what a signed-in patient can reach", () => {
  test.use({ storageState: PATIENT_STATE });

  test("reaches their own dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome back");
  });

  test("is refused the admin area, and told so rather than asked to log in again", async ({
    page,
  }) => {
    await page.goto("/admin");

    // /forbidden, not /login. They are signed in; signing in again would not
    // help, and sending them there implies it would.
    await expect(page).toHaveURL(/\/forbidden/);
  });

  test("sees no Administration link in the dashboard sidebar", async ({ page }) => {
    await page.goto("/dashboard");

    // Scoped to the sidebar. "My Appointments" also names a quick-action card
    // on this page, so asking for the name alone matches two things.
    const sidebar = page.getByRole("navigation", { name: "Dashboard" });

    await expect(sidebar.getByRole("link", { name: "My Appointments" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Administration" })).toBeHidden();
  });

  const ADMIN_PAGES = [
    "/admin/appointments",
    "/admin/doctors",
    "/admin/clinics",
    "/admin/services",
  ];

  for (const path of ADMIN_PAGES) {
    test(`is refused ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/forbidden/);
    });
  }
});

test.describe("what an admin can reach", () => {
  test.use({ storageState: ADMIN_STATE });

  test("reaches the admin area and sees the link in the sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("navigation", { name: "Dashboard" }).getByRole("link", {
        name: "Administration",
      }),
    ).toBeVisible();

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();
  });

  const ADMIN_PAGES = [
    "/admin/appointments",
    "/admin/doctors",
    "/admin/clinics",
    "/admin/services",
  ];

  for (const path of ADMIN_PAGES) {
    test(`an admin can open ${path}`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      expect(page.url()).not.toContain("/forbidden");
    });
  }
});
