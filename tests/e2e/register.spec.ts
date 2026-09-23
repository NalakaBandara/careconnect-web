import { test, expect } from "@playwright/test";

import { logout, uniqueEmail } from "./helpers";

// Registration is kept in its own file because the API rate limits it to 5 per
// hour per IP. One account per run is well inside that, but it means this file
// can be excluded while iterating on the rest:
//
//   npx playwright test --grep-invert "registration"
//
// Only the desktop project runs this file; see playwright.config.ts.
test.describe("registration", () => {
  // A brand new visitor, so no saved session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("rejects an incomplete form before anything is sent", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Create account" }).click();

    // Still on the form, with errors, and no account created. noValidate is set
    // on the form, so these messages come from our own validation rather than
    // the browser's built-in bubbles.
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator("#firstName-error")).toHaveText("Enter your first name");
    await expect(page.locator("#email-error")).toBeVisible();
  });

  test("rejects a weak password with a reason", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("First name").fill("E2E");
    await page.getByLabel("Last name").fill("Tester");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/register/);
    // Asserted through the error element, not by text. The field also carries a
    // hint saying "At least 8 characters", which is on the page before anything
    // is submitted, so matching the words alone would pass without the
    // validation working at all.
    await expect(page.locator("#password-error")).toHaveText(
      "Password must be at least 8 characters",
    );
  });

  test("creates an account, signs the user straight in, and logs out again", async ({ page }) => {
    const email = uniqueEmail();

    await page.goto("/register");
    await page.getByLabel("First name").fill("E2E");
    await page.getByLabel("Last name").fill("Tester");
    // A trailing space, because that is what a real person pasting an address
    // produces, and rejecting it was a genuine defect (DEF-014).
    await page.getByLabel("Email").fill(`${email} `);
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Create account" }).click();

    // Either the new account signs in, or the API says the hour's registration
    // budget is gone. Waiting only for the URL would report a 30 second timeout
    // and hide which of the two happened.
    const rateLimited = page
      .getByRole("alert")
      .filter({ hasText: /too many registration attempts/i });

    await expect(async () => {
      expect((await rateLimited.count()) > 0 || /\/dashboard/.test(page.url())).toBe(true);
    }).toPass({ timeout: 20_000 });

    // Skipped, not failed. The app did the right thing by showing the API's
    // message; there is simply no budget left to create an account with. 5 per
    // hour per IP, so a few debugging runs use it up.
    test.skip(
      (await rateLimited.count()) > 0,
      "the API allows only 5 registrations an hour per IP and that budget is spent",
    );

    // The API returns a token with the new account, so registration signs the
    // user in rather than sending them back to the login page.
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome back");

    // A new account is a patient, never an admin, whatever the API defaults to.
    await expect(
      page.getByRole("navigation", { name: "Dashboard" }).getByRole("link", {
        name: "Administration",
      }),
    ).toBeHidden();

    await logout(page);
    // Logging out must actually clear the cookie, not just move the user.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
