import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
const output = "docs/evidence/m05-visual-polish";
const screens = [
  ["explore", "/?area=Uyo"],
  ["feed", "/feed?area=Uyo"],
  ["search", "/search?area=Uyo&q=ring+light"],
  ["category", "/explore/solar?area=Uyo"],
  ["profile", "/b/amber-roof?area=Uyo"],
  ["products", "/b/amber-roof?area=Uyo&tab=products"],
  ["gallery", "/b/daybreak?area=Uyo&tab=gallery"],
  ["details", "/b/amber-roof?area=Uyo&tab=details"],
  ["event", "/posts/demo-little-ladder-post?area=Uyo"],
  ["portfolio", "/posts/demo-daybreak-post?area=Uyo"],
  ["compare-two", "/compare?area=Uyo&ids=demo-amber-roof,demo-daybreak"],
  [
    "compare-three",
    "/compare?area=Uyo&ids=demo-amber-roof,demo-daybreak,demo-sunward",
  ],
  ["design", "/design"],
] as const;
for (const width of [320, 390, 768, 1280])
  test(`photo-led screens at ${width}px`, async ({ page }) => {
    test.setTimeout(240000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 844 });
    mkdirSync(output, { recursive: true });
    const evidence = [];
    for (const [name, path] of screens) {
      await page.goto(path);
      await expect(
        page.getByRole("complementary", { name: "Staging disclosure" }),
      ).toHaveCount(1);
      await expect(
        page.locator("main .development-notice,main .dev-label"),
      ).toHaveCount(0);
      const images = page.locator("img:visible");
      for (let i = 0; i < (await images.count()); i++) {
        const img = images.nth(i);
        await img.scrollIntoViewIfNeeded();
        await expect(img).toHaveJSProperty("complete", true);
        await expect
          .poll(async () =>
            img.evaluate((el: HTMLImageElement) => el.naturalWidth),
          )
          .toBeGreaterThan(0);
      }
      await page.evaluate(() => {
        document
          .querySelectorAll<HTMLElement>(
            ".feature-grid,.category-row,.profile-tabs,.compare-facts",
          )
          .forEach((el) => (el.scrollLeft = 0));
        window.scrollTo(0, 0);
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
      await page.screenshot({
        path: `${output}/${name}-${width}.png`,
        fullPage: true,
      });
      evidence.push({
        name,
        path,
        width,
        images: await images.count(),
        brokenImages: 0,
        overflow: false,
        axeViolations: 0,
      });
    }
    writeFileSync(
      `${output}/screens-${width}.json`,
      JSON.stringify(evidence, null, 2) + "\n",
    );
  });
test("gallery keyboard, all six types, safe contacts and missing Google data", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/feed?area=Uyo");
  for (const type of [
    "service",
    "offer",
    "arrival",
    "update",
    "event",
    "portfolio",
  ])
    expect(await page.locator(`.post-type-${type}`).count()).toBeGreaterThan(0);
  await page.goto("/posts/demo-daybreak-post?area=Uyo");
  await expect(page.locator(".post-media .gallery-item")).toHaveCount(5);
  const opener = page.locator(".post-media .gallery-item").first();
  await opener.click();
  const dialog = page.getByRole("dialog", { name: /photos$/ });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("1 of 5");
  await page.keyboard.press("ArrowRight");
  await expect(dialog).toContainText("2 of 5");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page.goto("/b/amber-roof?area=Uyo&tab=details");
  await expect(page.locator(".details-list")).toContainText("Garden Lane");
  await expect(page.locator(".details-list")).toContainText("Monday–Friday");
  expect(await page.locator('a[href^="tel:"],a[href*="wa.me"]').count()).toBe(
    0,
  );
  await page.goto("/b/amber-roof?area=Uyo&tab=reviews");
  await expect(page.locator("main")).toContainText(
    "Jado does not collect customer ratings",
  );
  await expect(page.locator("main .verified")).toHaveCount(0);
});
test("Data Saver limits collage requests to the smaller first image", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("jado-data-saver", "true"),
  );
  const images: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "image") images.push(r.url());
  });
  await page.goto("/posts/demo-daybreak-post?area=Uyo");
  await expect(page.locator(".post-media .gallery-item")).toHaveCount(1);
  await expect(page.locator(".post-media")).toContainText("View 5 photos");
  await expect(page.locator(".post-media img")).toHaveJSProperty(
    "complete",
    true,
  );
  expect(
    images.filter(
      (url) => url.includes("/photo-") && !url.includes("-small.webp"),
    ),
  ).toEqual([]);
  await page.locator(".post-media a").click();
  const dialog = page.getByRole("dialog", { name: /photos$/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Next image" }).click();
  await expect(dialog).toContainText("2 of 5");
});
test("profile post and review tabs at all four widths", async ({ page }) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const tab of ["posts", "reviews"]) {
      await page.goto(`/b/amber-roof?area=Uyo&tab=${tab}`);
      for (const img of await page.locator("img:visible").all()) {
        await img.scrollIntoViewIfNeeded();
        await expect
          .poll(async () =>
            img.evaluate((el: HTMLImageElement) => el.naturalWidth),
          )
          .toBeGreaterThan(0);
      }
      await page.evaluate(() => {
        document
          .querySelectorAll<HTMLElement>(
            ".feature-grid,.category-row,.profile-tabs,.compare-facts",
          )
          .forEach((el) => (el.scrollLeft = 0));
        window.scrollTo(0, 0);
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `${output}/profile-${tab}-${width}.png`,
        fullPage: true,
      });
      const file = `${output}/screens-${width}.json`;
      const rows = JSON.parse(readFileSync(file, "utf8")).filter(
        (r: { name: string }) => r.name !== `profile-${tab}`,
      );
      rows.push({
        name: `profile-${tab}`,
        path: `/b/amber-roof?area=Uyo&tab=${tab}`,
        width,
        images: await page.locator("img:visible").count(),
        brokenImages: 0,
        overflow: false,
        axeViolations: 0,
      });
      writeFileSync(file, JSON.stringify(rows, null, 2) + "\n");
    }
  }
});

test("unavailable media keeps its reserved frame and recovers on reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/demo-businesses/amber-roof/photo-1*", (route) =>
    route.abort(),
  );
  await page.goto("/b/amber-roof?area=Uyo");
  await expect(page.locator(".profile-cover .media-error")).toBeVisible();
  const size = await page.locator(".profile-cover").boundingBox();
  expect(size!.height).toBeGreaterThan(100);
  await page.screenshot({ path: `${output}/media-error-390.png` });
  await page.unroute("**/demo-businesses/amber-roof/photo-1*");
  await page.reload();
  await expect
    .poll(async () =>
      page
        .locator(".profile-cover img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(page.locator(".profile-cover .media-error")).toHaveCount(0);
});
