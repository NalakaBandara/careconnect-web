import { test, expect } from "@playwright/test";

import { PATIENT_STATE } from "./auth-state";
import { bookFirstFreeSlot, cancelAppointment, waitForAvailability } from "./helpers";

// Whole journeys through a real browser, against the real API. Only the desktop
// project runs this file; see playwright.config.ts.

test.describe("browsing the directory as a guest", () => {
  // Explicitly no session, so this is a genuine first visit.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("searching by name narrows the results", async ({ page }) => {
    await page.goto("/professionals");

    const heading = page.getByRole("heading", { name: /professionals? listed/ });
    const before = Number((await heading.textContent())?.match(/\d+/)?.[0] ?? 0);
    expect(before, "the directory is empty, so there is nothing to narrow").toBeGreaterThan(0);

    // A term that cannot match everybody. Taken from the first card rather
    // than hardcoded, so this does not break when the data changes.
    const firstName = await page.getByRole("heading", { level: 3 }).first().textContent();
    const surname = (firstName ?? "").trim().split(" ").pop() ?? "";

    await page.getByLabel("Professional name or speciality").fill(surname);
    await page.getByRole("button", { name: "Search" }).click();

    // The term lands in the URL, which is what makes a filtered view
    // shareable, so it is worth asserting and not just the count.
    await expect(page).toHaveURL(new RegExp(`term=${surname}`, "i"));
    await expect(heading).toBeVisible();
    expect(Number((await heading.textContent())?.match(/\d+/)?.[0] ?? 0)).toBeLessThanOrEqual(
      before,
    );
  });

  test("filtering by speciality changes the URL and the count", async ({ page }) => {
    await page.goto("/professionals");

    // exact, because the search box above is labelled "Professional name or
    // speciality" and a substring match picks up both.
    const select = page.getByLabel("Speciality", { exact: true });
    const options = await select.locator("option").allTextContents();
    expect(options.length, "no specialities were offered by the API").toBeGreaterThan(1);

    // Index 0 is "All specialities".
    await select.selectOption({ index: 1 });

    await expect(page).toHaveURL(/speciality=/);
    await expect(page.getByRole("link", { name: "Clear filters" }).first()).toBeVisible();
  });

  test("a guest can read a profile but is asked to sign in before booking", async ({ page }) => {
    await page.goto("/professionals");
    await page.getByRole("link", { name: "View profile" }).first().click();

    await expect(page).toHaveURL(/\/professionals\/\d+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The point of the public directory: read freely, account needed only to
    // book. A guest gets an explanation rather than being thrown at a login
    // form with no reason given.
    await page.getByRole("button", { name: "View appointment options" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(/log in or create an account/i);
    await expect(dialog.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Register" })).toBeVisible();

    // Dismissing it leaves them where they were, still able to read the profile.
    await dialog.getByRole("button", { name: "Continue browsing" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/professionals\/\d+/);
  });
});

test.describe("booking and managing an appointment", () => {
  test.use({ storageState: PATIENT_STATE });

  // Serial, not parallel. Each test books a real appointment, and two tests
  // racing for the same first free slot would leave one of them with a
  // conflict that is not a bug in the app.
  //
  // The longer timeout is for the API's rate limit: loading availability costs
  // one request per working day, and when the minute's budget is gone the
  // helper waits for it to come back rather than calling that a failure.
  test.describe.configure({ mode: "serial", timeout: 420_000 });

  test("books the first free slot, sees it listed, then cancels it", async ({ page }) => {
    const reference = await bookFirstFreeSlot(page);
    expect(reference, "no booking reference was shown on the confirmation page").toMatch(
      /^CC-\d+-[A-Z]+$/,
    );

    // It must actually be in the list, not only on the confirmation page. This
    // is what catches a mutation that succeeded but was served from a stale
    // cache afterwards.
    await page.goto("/dashboard/appointments");
    await expect(page.getByText(`Reference ${reference}`)).toBeVisible();

    await page.goto(`/dashboard/appointments/${reference}`);
    await expect(page.getByText(reference).first()).toBeVisible();

    await cancelAppointment(page);

    // Cancelled, so it drops out of Upcoming and the cancel controls go away.
    await expect(page.getByText("Cancelled").first()).toBeVisible();
    await page.goto("/dashboard/appointments");
    await expect(page.getByText(`Reference ${reference}`)).toBeHidden();
  });

  test("reschedules an appointment, keeping the same reference", async ({ page }) => {
    const reference = await bookFirstFreeSlot(page);

    await page.goto(`/dashboard/appointments/${reference}`);
    const originalTime = await page
      .getByRole("definition")
      .filter({ hasText: /minutes\)/ })
      .textContent();

    await page.getByRole("link", { name: "Reschedule" }).click();
    // level: 1, because the step heading and the panel heading below it say the
    // same words.
    await expect(page.getByRole("heading", { level: 1, name: "Choose a new time" })).toBeVisible();

    // Picking a time and reaching the confirm step is retried as one unit.
    // Choosing a time reloads the page, which needs availability again, and if
    // the API's 30-a-minute limit bites in between, the page correctly falls
    // back to step one and says the times could not be loaded. Retrying is what
    // a person would do.
    const confirmStep = page.getByRole("heading", { level: 1, name: "Confirm the new time" });

    await expect(async () => {
      if (await confirmStep.isVisible()) return;

      const free = await waitForAvailability(page);
      // .last(), so it is a different time from the one already held.
      await free.last().click();
      await expect(confirmStep).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 180_000, intervals: [5_000, 20_000, 30_000, 30_000, 30_000] });
    // Retried, because confirming re-checks availability against the API and
    // that can run into the 30-a-minute limit. The app now says "we could not
    // confirm that time just now" rather than claiming the slot is taken, so
    // pressing the button again after a pause is the right response.
    await expect(async () => {
      if (/moved=1/.test(page.url())) return;
      await page.getByRole("button", { name: "Confirm new time" }).click();
      await page.waitForURL(/moved=1/, { timeout: 20_000 });
    }).toPass({ timeout: 150_000, intervals: [15_000, 30_000, 30_000, 30_000] });
    await expect(page.getByText(/has been moved/i)).toBeVisible();

    // The reference deliberately does not change when an appointment moves:
    // the patient and the clinic have already quoted it to each other.
    await expect(page).toHaveURL(new RegExp(reference));
    const newTime = await page
      .getByRole("definition")
      .filter({ hasText: /minutes\)/ })
      .textContent();
    expect(newTime).not.toBe(originalTime);

    await cancelAppointment(page);
  });
});
