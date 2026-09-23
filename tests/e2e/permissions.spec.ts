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
