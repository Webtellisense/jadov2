import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { connectDatabase } from "@/db/connection";
import { sql } from "drizzle-orm";
import { rateLimit } from "@/db/schema";
const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
test.beforeEach(async () => {
  await db.delete(rateLimit);
});
test.afterAll(async () => {
  await pool.end();
});
async function login(page: Page, email = "consumer@example.invalid") {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://localhost:3100" },
    data: { email, password: process.env.DEV_SEED_PASSWORD },
  });
  expect(response.status()).toBe(200);
}
test("normal discovery anonymously exposes labelled persisted fixtures", async ({
  page,
}) => {
  const result = await page.request.get("/api/discovery?area=Uyo");
  expect((await result.json()).businesses).toHaveLength(10);
  await page.goto("/?area=Uyo");
  await expect(page.getByText("Development data").first()).toBeVisible();
  await page.goto("/b/amber-roof?area=Uyo");
  await expect(
    page.getByRole("heading", { name: "Amber Roof Solar", exact: true }),
  ).toBeVisible();
});
test("manual area and denied GPS both reach anonymous Explore", async ({
  page,
  context,
}) => {
  await context.clearPermissions();
  await page.goto("/location");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByRole("status")).toContainText("choose your area");
  await page.getByLabel("City or area").selectOption("Uyo");
  await page.getByRole("button", { name: "Explore this area" }).click();
  await expect(page).toHaveURL("/?area=Uyo");
  await expect(page.getByText("Development data").first()).toBeVisible();
});
test("GPS suggests Uyo without saving coordinates", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 5.0377, longitude: 7.9128 });
  await page.goto("/location");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByRole("status")).toContainText("Suggested area: Uyo");
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some(
        (k) => k.includes("latitude") || k.includes("longitude"),
      ),
    ),
  ).toBe(false);
});
test("SQL-backed search, filters and back/forward preserve the query", async ({
  page,
}) => {
  await login(page);
  await page.goto("/?area=Uyo");
  await page.getByRole("searchbox").fill("ring light");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=ring\+light/);
  await expect(page.locator(".business-card")).toHaveCount(1);
  await expect(page.locator(".business-card")).toContainText(
    "Pocket Beam Supply",
  );
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/search?area=Uyo");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByLabel("Category", { exact: true }).selectOption("solar");
  await page.getByLabel("Current offers only").check();
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.locator(".business-card")).toHaveCount(2);
  await expect(page).toHaveURL(/category=solar/);
  await page.reload();
  await expect(page.locator(".business-card")).toHaveCount(2);
  await page.goBack();
  await page.goForward();
  await expect(page.locator(".business-card")).toHaveCount(2);
});
test("comparison selection prevents duplicates and a fourth selection", async ({
  page,
}) => {
  await login(page);
  await page.goto("/search?area=Uyo");
  for (const name of [
    "Amber Roof Solar",
    "Daybreak Power Studio",
    "Sunward Energy Workshop",
  ])
    await page
      .getByRole("checkbox", { name: `Compare ${name}`, exact: true })
      .check();
  await page
    .getByRole("checkbox", { name: "Compare Pocket Beam Supply", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "up to three" }),
  ).toContainText("up to three");
  await expect(
    page.getByRole("checkbox", {
      name: "Compare Pocket Beam Supply",
      exact: true,
    }),
  ).not.toBeChecked();
  await page.getByRole("link", { name: "Compare (3)", exact: true }).click();
  await expect(page.locator(".comparison-card")).toHaveCount(3);
  await expect(page.locator(".comparison-card").first()).toContainText(
    "Not available · no Google data",
  );
  await page.goto("/compare?area=Uyo&ids=demo-amber-roof,demo-amber-roof");
  await expect(
    page.getByRole("heading", { name: "Check your search" }),
  ).toBeVisible();
});
for (const kind of ["message", "follow", "like"]) {
  test(`${kind} gate preserves business and post through real sign-in without faking a write`, async ({
    page,
  }) => {
    await login(page);
    const post = kind === "like" ? "&post=demo-amber-roof-post" : "";
    const target = `/action?kind=${kind}&business=demo-amber-roof&area=Uyo${post}`;
    await page.context().clearCookies();
    await page.goto(target);
    await expect(page).toHaveURL(/sign-in\?next=/);
    await page.getByLabel("Email address").fill("consumer@example.invalid");
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.DEV_SEED_PASSWORD!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(target);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Amber Roof Solar",
    );
    await expect(
      page.getByRole("heading", {
        name:
          kind === "message"
            ? "Messaging isn't connected yet"
            : "This interaction isn't connected yet",
      }),
    ).toBeVisible();
  });
}
test("expired offer, unavailable profile, empty area and invalid input are honest", async ({
  page,
}) => {
  await login(page);
  await page.goto("/posts/demo-sunward-offer?area=Uyo");
  await expect(page.getByText("This offer has ended")).toBeVisible();
  await page.goto("/search?area=Eket");
  await expect(
    page.getByRole("heading", { name: "No matching businesses yet" }),
  ).toBeVisible();
  await page.goto("/b/missing?area=Uyo");
  await expect(
    page.getByRole("heading", { name: "We couldn’t find that page." }),
  ).toBeVisible();
  expect(
    (await page.request.get("/api/discovery?area=Uyo&sort=bogus")).status(),
  ).toBe(400);
});
test("offline notice, data saver persistence and keyboard dialog access", async ({
  page,
  context,
}) => {
  await login(page);
  await page.goto("/account");
  await page.getByRole("switch", { name: /Data saver/ }).check();
  await page.reload();
  await expect(page.getByRole("switch", { name: /Data saver/ })).toBeChecked();
  await page.getByRole("switch", { name: /Data saver/ }).uncheck();
  await context.setOffline(true);
  await expect(
    page.getByRole("alert").filter({ hasText: "offline" }),
  ).toBeVisible();
  await context.setOffline(false);
  await page.goto("/search?area=Uyo");
  await page.getByRole("button", { name: "Filters", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Filters", exact: true }),
  ).toBeFocused();
});
test("copy and WhatsApp share preserve the comparison URL without contacting a provider", async ({
  page,
  context,
}) => {
  await login(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/compare?area=Uyo&ids=demo-amber-roof,demo-daybreak");
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Link copied" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    page.url(),
  );
  await page.evaluate(() => {
    window.open = (url) => {
      Object.assign(window, { lastShareURL: String(url) });
      return null;
    };
  });
  await page
    .getByRole("button", { name: "Share on WhatsApp", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => (window as typeof window & { lastShareURL: string }).lastShareURL,
    ),
  ).toBe(`https://wa.me/?text=${encodeURIComponent(page.url())}`);
});
test("real database wait and failure show skeletons, safe error and working retry", async ({
  page,
}) => {
  await login(page);
  const client = await pool.connect();
  await client.query("BEGIN");
  await client.query(
    "LOCK TABLE development_business IN ACCESS EXCLUSIVE MODE",
  );
  try {
    await page.goto("/search?area=Uyo", { waitUntil: "commit" });
    await expect(
      page.getByRole("status", { name: "Loading businesses" }).first(),
    ).toBeVisible();
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
  await expect(page.locator(".business-card")).toHaveCount(10);
  await db.execute(
    sql`ALTER TABLE development_category RENAME TO unavailable_category`,
  );
  try {
    await page.goto("/search?area=Uyo");
    await expect(
      page.getByRole("heading", { name: "Something is unavailable." }),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText("SELECT");
  } finally {
    await db.execute(
      sql`ALTER TABLE unavailable_category RENAME TO development_category`,
    );
  }
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator(".business-card")).toHaveCount(10);
});
test("authentication forms cannot submit credentials in a URL before JavaScript is ready", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("http://localhost:3100/sign-in");
    const form = page.locator("form.form-stack");
    await expect(form).toHaveAttribute("method", "post");
    await expect(form.locator('button[type="submit"]')).toBeDisabled();
  } finally {
    await context.close();
  }
});
test("selected profile keeps its Message bar and comparison tray apart", async ({
  page,
}) => {
  await login(page);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/b/amber-roof?area=Uyo&ids=demo-amber-roof,demo-daybreak");
    const action = await page.locator(".action-bar").boundingBox();
    const tray = await page.locator(".compare-tray").boundingBox();
    expect(action && tray && action.y + action.height <= tray.y).toBe(true);
  }
});
const screens: [string, string][] = [
  ["location", "/location"],
  ["public-empty", "/?area=Eket"],
  ["sign-in", "/sign-in"],
  ["account", "/account"],
  ["explore", "/?area=Uyo"],
  ["search", "/search?area=Uyo&q=ring+light"],
  ["category", "/explore/solar?area=Uyo"],
  ["profile", "/b/amber-roof?area=Uyo"],
  [
    "profile-selected",
    "/b/amber-roof?area=Uyo&ids=demo-amber-roof,demo-daybreak",
  ],
  ["profile-reviews", "/b/amber-roof?area=Uyo&tab=reviews"],
  ["profile-details", "/b/amber-roof?area=Uyo&tab=details"],
  ["post", "/posts/demo-pocket-beam-post?area=Uyo"],
  ["expired-post", "/posts/demo-sunward-offer?area=Uyo"],
  ["feed", "/feed?area=Uyo&type=arrival"],
  ["compare-builder", "/compare?area=Uyo"],
  [
    "compare-result",
    "/compare?area=Uyo&ids=demo-amber-roof,demo-daybreak,demo-sunward",
  ],
  ["messages", "/messages?area=Uyo"],
  ["notifications", "/notifications?area=Uyo"],
  ["following", "/following?area=Uyo"],
  ["owner-onboarding", "/owner/onboarding"],
  ["owner-today", "/owner/today"],
  ["owner-posts", "/owner/posts"],
  ["owner-inbox", "/owner/inbox"],
  ["owner-insights", "/owner/insights"],
  ["owner-profile", "/owner/profile"],
  ["owner-share", "/owner/share"],
  ["admin", "/admin"],
  ["verification", "/verification"],
  ["help", "/help"],
  ["privacy", "/privacy"],
  ["not-found", "/missing-page"],
  ["gallery", "/design"],
];
for (const width of [320, 390, 768, 1280])
  test(`major screens: ${width}px screenshots, overflow and accessibility`, async ({
    page,
  }) => {
    test.setTimeout(300000);
    mkdirSync("docs/evidence/m05", { recursive: true });
    await page.setViewportSize({ width, height: 900 });
    await login(page, "admin@example.invalid");
    for (const [name, url] of screens) {
      await page.goto(url);
      await page.locator("h1").waitFor();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${name} overflow`,
      ).toBe(true);
      const violations = (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations;
      expect(violations, `${name} accessibility`).toEqual([]);
      await page.screenshot({
        path: `docs/evidence/m05/${name}-${width}.png`,
        fullPage: true,
        caret: "initial",
      });
    }
  });
