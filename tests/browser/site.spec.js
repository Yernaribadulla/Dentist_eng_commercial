import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
});
async function ready(page) {
  await page.goto("/");
  await expect(page.locator(".dir")).toHaveCount(3);
  await expect(page.locator("html")).toHaveClass(/js/);
}
async function booking(page) {
  await page.locator(".hero-content [data-book]").click();
  await expect(page.locator("#booking-modal")).toBeVisible();
  await page
    .locator("#booking-modal")
    .getByRole("button", { name: "Consultation", exact: true })
    .click();
}

test("booking validates all fields, preserves a draft and explicitly previews without transmitting", async ({
  page,
}) => {
  const posts = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await ready(page);
  await booking(page);
  await page
    .getByRole("button", { name: "Preview request", exact: true })
    .click();
  await expect(page.locator("#booking-name")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#booking-phone")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.locator("#booking-name").fill("Sample Guest");
  await page.locator("#booking-phone").fill("+7 700 000 00 00");
  await page.locator("#booking-consent").check();
  await page.locator("#booking-modal .back").click();
  await page.getByRole("button", { name: "Orthodontics", exact: true }).click();
  await expect(page.locator("#booking-name")).toHaveValue("Sample Guest");
  await expect(page.locator("#booking-phone")).toHaveValue("+7 700 000 00 00");
  await page
    .getByRole("button", { name: "Preview request", exact: true })
    .click();
  await expect(page.locator("#booking-modal")).toContainText(
    "Nothing has been sent or booked.",
  );
  await expect(page.locator("#booking-modal")).toContainText("Orthodontics");
  await page
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  await booking(page);
  await expect(page.locator("#booking-name")).toHaveValue("");
  expect(posts).toEqual([]);
});
test("typed markup stays text on back navigation and preview", async ({
  page,
}) => {
  await ready(page);
  await booking(page);
  const payload = '\"><img src=x onerror="window.injected=true">';
  await page.locator("#booking-name").fill(payload);
  await page.locator("#booking-phone").fill("+7 700 000 00 00");
  await page.locator("#booking-consent").check();
  await page.locator("#booking-modal .back").click();
  await page
    .locator("#booking-modal")
    .getByRole("button", { name: "Consultation", exact: true })
    .click();
  await expect(page.locator("#booking-name")).toHaveValue(payload);
  await page
    .getByRole("button", { name: "Preview request", exact: true })
    .click();
  await expect(page.locator("#booking-modal")).toContainText(payload);
  await expect(page.locator("#booking-modal img")).toHaveCount(0);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
});
test("direction replaces its drawer with booking, Escape restores original focus and scroll", async ({
  page,
}) => {
  await ready(page);
  const card = page.locator(".dir").first();
  await card.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await card.click();
  await expect(page.locator("#doctor-modal")).toBeVisible();
  await page.locator("#doctor-modal [data-book]").click();
  await expect(page.locator("#booking-modal .summary")).toContainText(
    "Orthodontics",
  );
  await expect(page.locator("#doctor-modal")).not.toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(card).toBeFocused();
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(
    3,
  );
});
test("dialog contains focus and rapid reopening cannot be hidden by an old close timer", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  await page.locator(".hero-content [data-book]").click();
  await page.locator("#booking-modal .x").click();
  // Exercise a second invocation during the closing transition.
  await page.locator(".hero-content [data-book]").dispatchEvent("click");
  await page.waitForTimeout(400);
  await expect(page.locator("#booking-modal")).toBeVisible();
  await page.locator("#booking-modal .choice").last().focus();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      document.getElementById("booking-modal").contains(document.activeElement),
    ),
  ).toBe(true);
});
test("gallery switches the actual image and keeps the selected control synchronized", async ({
  page,
}) => {
  await ready(page);
  await page.locator('[data-slat="2"]').click();
  await expect(page.locator("#gallery-image")).toHaveAttribute(
    "src",
    /labo\.webp$/,
  );
  await expect(page.locator('[data-slat="2"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator('[data-slat="1"]').click();
  await page.locator('[data-slat="3"]').click();
  await expect(page.locator("#gallery-image")).toHaveAttribute(
    "src",
    /restore\.webp$/,
  );
});
test("native comparison range has exact keyboard increments without post-click drift", async ({
  page,
}) => {
  await ready(page);
  const input = page.locator(".cmp-input");
  await input.focus();
  await input.press("ArrowRight");
  await expect(input).toHaveValue("53");
  await expect(page.locator("[data-compare]")).toHaveCSS("--pos", "53");
  await input.press("Home");
  await expect(input).toHaveValue("0");
  await input.press("End");
  await expect(input).toHaveValue("100");
});
test("accordions keep hidden controls inert and smile options update", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#svc-b2").click();
  await expect(page.locator("#svc-b1")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.locator("#svc-p1")).toHaveAttribute("inert", "");
  await expect(page.locator("#svc-p2")).not.toHaveAttribute("inert");
  await page.locator("#faq-b1").click();
  await page.locator("#faq-b2").click();
  await expect(page.locator("#faq-b1")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.getByRole("button", { name: "Bright", exact: true }).click();
  await expect(page.locator(".smile-mode")).toHaveText("Bright");
});
test("theme persists explicit choices but still follows the system before any choice", async ({
  page,
}) => {
  await ready(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("[data-theme-toggle]:visible").click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
test("motion can be paused, persists and respects a live reduced-motion change", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  expect(
    await page
      .locator(".scan-svg .sweep")
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("sweep");
  await page.locator("[data-motion-toggle]").first().click();
  await expect(page.locator("html")).toHaveClass(/motion-paused/);
  await page.reload();
  await expect(page.locator("[data-motion-toggle]").first()).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.locator("[data-motion-toggle]").first().click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-motion-toggle]").first()).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`layout and navigation work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 1100) {
      await page.locator(".menu-btn").click();
      await expect(page.locator("#menu")).toBeVisible();
      await page.locator('#menu a[href="#services"]').click();
      await expect(page.locator("#menu")).not.toBeVisible();
      await expect(page.locator(".menu-btn")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    } else await page.locator('.rail a[href="#services"]').click();
    await expect(page).toHaveURL(/#services$/);
    await expect(page.locator("#services-title")).toBeInViewport();
  });
}
test("mobile treatment introduction stacks and the sticky header stays opaque", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const title = await page.locator("#services-title").boundingBox();
  const note = await page.locator("#services .head-note").boundingBox();
  expect(note.y).toBeGreaterThanOrEqual(title.y + title.height);
  await page.locator("#services").scrollIntoViewIfNeeded();
  await expect(page.locator(".topbar")).toHaveCSS(
    "background-color",
    "rgb(244, 239, 231)",
  );
});

test("desktop navigation exposes every section without overlapping controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await ready(page);
  for (const link of await page.locator(".rail-nav a").all())
    await expect(link).toBeVisible();
  const brand = await page.locator(".brand-v").boundingBox();
  const nav = await page.locator(".rail-nav").boundingBox();
  const theme = await page.locator(".rail > .icon-btn").boundingBox();
  const cta = await page.locator(".float-cta").boundingBox();
  expect(brand.x + brand.width).toBeLessThan(nav.x);
  expect(nav.x + nav.width).toBeLessThan(theme.x);
  expect(theme.x + theme.width).toBeLessThan(cta.x);
});

test("all requested local assets resolve without errors", async ({ page }) => {
  const failures = [];
  page.on("response", (response) => {
    if (
      response.url().startsWith("http://127.0.0.1") &&
      response.status() >= 400
    )
      failures.push(response.url());
  });
  page.on("pageerror", (error) => failures.push(error.message));
  await ready(page);
  for (const section of [
    "#about",
    "#services",
    "#results",
    "#technology",
    "#contacts",
  ])
    await page.locator(section).scrollIntoViewIfNeeded();
  expect(failures).toEqual([]);
});
test("core content stays visible when JavaScript is disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("#about-title")).toBeVisible();
  await expect(page.locator(".no-js-note")).toContainText(
    "Interactive previews require JavaScript",
  );
  await context.close();
});
test("automated accessibility checks cover both themes, mobile and booking", async ({
  page,
}) => {
  await ready(page);
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page.locator("[data-theme-toggle]:visible").click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => ({
          target: node.target,
          reason: node.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await booking(page);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({
        target: node.target,
        reason: node.failureSummary,
      })),
    })),
  ).toEqual([]);
});
