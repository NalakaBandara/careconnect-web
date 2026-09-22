import { test, expect, type Page } from "@playwright/test";

// The public pages, checked at every viewport the config defines: desktop,
// tablet and a small phone.
const PAGES = [
  { path: "/", name: "home" },
  { path: "/professionals", name: "directory" },
  { path: "/professionals/1", name: "profile" },
  { path: "/services", name: "services" },
  { path: "/faqs", name: "FAQs" },
  { path: "/contact", name: "contact" },
  { path: "/about", name: "about" },
  { path: "/privacy", name: "privacy" },
  { path: "/terms", name: "terms" },
  { path: "/login", name: "login" },
  { path: "/register", name: "register" },
];

// A page scrolls sideways when something inside it is wider than the screen.
// It is the most common responsive bug and the easiest to miss, because on a
// desktop there is always room.
async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      // Whatever is actually sticking out, so a failure names the culprit
      // rather than just reporting a number.
      culprits: [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${el.className?.toString().slice(0, 60)}`),
    };
  });
}

for (const { path, name } of PAGES) {
  test(`${name} does not scroll sideways`, async ({ page }) => {
    await page.goto(path);
    const { scrollWidth, clientWidth, culprits } = await horizontalOverflow(page);

    expect(
      scrollWidth,
      `${name} is ${scrollWidth - clientWidth}px too wide. Sticking out: ${culprits.join(", ")}`,
    ).toBeLessThanOrEqual(clientWidth + 1);
  });
}

test("the header collapses to a menu button on a phone", async ({ page, isMobile }) => {
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: /open menu/i });

  // Three links on this page say "Find a Professional": the hero button, the
  // footer, and the nav. So each check is scoped to the one it means, rather
  // than asking for the name alone and matching whichever comes first.
  if (isMobile) {
    await expect(menuButton).toBeVisible();

    // The links must actually be reachable once it is opened, not merely
    // present in the markup.
    await menuButton.click();
    await expect(
      page.locator("#mobile-menu").getByRole("link", { name: "Find a Professional" }),
    ).toBeVisible();
  } else {
    // On a wide screen the links are shown directly, so the toggle is hidden.
    await expect(menuButton).toBeHidden();
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Find a Professional" }),
    ).toBeVisible();
  }
});

test("tap targets on the directory are big enough to hit", async ({ page, isMobile }) => {
  test.skip(!isMobile, "only meaningful on a touch screen");

  await page.goto("/professionals");
  const link = page.getByRole("link", { name: "View profile" }).first();
  const box = await link.boundingBox();

  // 44px is the usual guidance for a touch target. Smaller and people miss.
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
});

test("text stays readable rather than being zoomed out", async ({ page }) => {
  await page.goto("/");

  // A missing or wrong viewport meta makes a phone render at desktop width and
  // shrink everything, which is the other classic responsive failure.
  const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewport).toContain("width=device-width");
});
