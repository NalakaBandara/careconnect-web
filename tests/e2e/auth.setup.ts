import { test as setup, expect } from "@playwright/test";

import { ADMIN_STATE, PATIENT_STATE } from "./auth-state";

// Signs in once per run and saves the session, so every other test starts
// already logged in.
//
// This is not only tidy. The API rate limits authentication: 5 registrations
// per hour and 10 logins per 15 minutes, per IP. A suite that registered or
// logged in inside each test used the whole hour's budget in one run and then
// failed with 429s that looked like application bugs.

const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL ?? "";
const PATIENT_PASSWORD = process.env.E2E_PATIENT_PASSWORD ?? "";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

setup("sign in as a patient", async ({ page }) => {
  expect(
    PATIENT_EMAIL,
    "E2E_PATIENT_EMAIL is not set. See .env.example for what the end to end tests need.",
  ).not.toBe("");

  await page.goto("/login");
  await page.getByLabel("Email").fill(PATIENT_EMAIL);
  await page.getByLabel("Password").fill(PATIENT_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();

  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: PATIENT_STATE });
});

setup("sign in as an admin", async ({ page }) => {
  expect(ADMIN_EMAIL, "E2E_ADMIN_EMAIL is not set. See .env.example.").not.toBe("");

  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();

  await page.waitForURL(/\/dashboard/);
  await page.context().storageState({ path: ADMIN_STATE });
});
