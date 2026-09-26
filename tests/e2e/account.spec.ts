import { test, expect } from "@playwright/test";

import { uniqueEmail } from "./helpers";

// Closing an account is irreversible, so this always uses a brand new account
// registered for the purpose, never the shared test patient.
//
// Registration is rate limited to 5 an hour per IP. When that budget is spent
// the test skips with the reason rather than failing.
test.describe("closing an account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("removes the account, logs the user out, and stops the login working", async ({
    page,
  }) => {
    const email = uniqueEmail("close");
    const password = "Password123!";

    await page.goto("/register");
    await page.getByLabel("First name").fill("Close");
    await page.getByLabel("Last name").fill("Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    const rateLimited = page.getByRole("alert").filter({ hasText: /too many registration/i });
    await expect(async () => {
      expect((await rateLimited.count()) > 0 || /\/dashboard/.test(page.url())).toBe(true);
    }).toPass({ timeout: 20_000 });
    test.skip((await rateLimited.count()) > 0, "the hour's registration budget is spent");

    // Two steps, on purpose: open the dialog, then confirm inside it.
    await page.getByRole("button", { name: "Close my account" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Without ticking the box, it refuses. The server checks this too.
    await dialog.getByRole("button", { name: "Close my account" }).click();
    await expect(dialog.getByRole("alert")).toContainText(/cannot be undone/i);

    await dialog.getByLabel(/I understand/).check();
    await dialog.getByRole("button", { name: "Close my account" }).click();

    // Landed on the home page, told what happened, and signed out.
    await expect(page).toHaveURL(/\/\?closed=1$/);
    await expect(page.getByRole("status")).toContainText(/account has been closed/i);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    // The old email and password no longer work.
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
