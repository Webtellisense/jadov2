import { eq, sql } from "drizzle-orm";
import { user, rateLimit } from "@/db/schema";
import {
  createBusinessDraft,
  listBusinessDrafts,
} from "@/server/business-drafts";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { connectDatabase } from "@/db/connection";
import { createAuth } from "@/server/auth";
import { readConfig } from "@/lib/config";
const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
const config = readConfig();
const email = "slice-one-browser@example.invalid",
  password = "Slice1-password-strong-12945";
let code = "";
// Automated test setup only. No mailer or fake provider is exposed to the running application.
const auth = createAuth(
  db,
  config,
  false,
  {
    available: true,
    async send(message) {
      code = message.text.match(/\b\d{6}\b/)![0];
    },
  },
  {},
);
const output = "docs/evidence/m25-slice1";
test.beforeAll(async () => {
  async function post(endpoint: string, body: unknown) {
    const response = await auth.handler(
      new Request(`${config.APP_ORIGIN}/api/auth${endpoint}`, {
        method: "POST",
        headers: {
          origin: config.APP_ORIGIN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }),
    );
    expect(response.status).toBe(200);
  }
  let existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (!existing) {
    await post("/sign-up/email", {
      name: "Slice 1 applicant",
      email,
      password,
    });
    await post("/email-otp/verify-email", { email, otp: code });
    existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  }
  if (
    !(await listBusinessDrafts(db, existing!)).some(
      (b) => b.details.name === "Screenshot private business",
    )
  )
    await createBusinessDraft(
      db,
      existing!,
      {
        name: "Screenshot private business",
        description: "A private applicant draft",
        serviceArea: "Uyo",
      },
      "browser-setup",
    );
});
test.beforeEach(async () => {
  await db.delete(rateLimit);
});
test.afterAll(async () => {
  await pool.end();
});
async function login(page: import("@playwright/test").Page) {
  await page.goto("/sign-in?next=/my-business");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/my-business");
  await expect(
    page.getByRole("heading", { name: "My Business", exact: true }),
  ).toBeVisible();
}
test("M25 private draft persists across refresh/sign-in and rejects cross-business mutation", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/my-business");
  await expect(
    page.getByRole("heading", { name: "Sign in to add your business" }),
  ).toBeVisible();
  expect((await page.request.get("/api/my-business")).status()).toBe(401);
  await login(page);
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Private browser business");
  await page.getByLabel("Service area", { exact: true }).fill("Uyo");
  await page.getByRole("button", { name: "Create private draft" }).click();
  await expect(page).toHaveURL(/\/my-business\/[a-f0-9-]+$/, {
    timeout: 20000,
  });
  const path = new URL(page.url()).pathname;
  await page
    .getByLabel("About your business")
    .fill("Saved private description");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  await expect(page.getByLabel("About your business")).toHaveValue(
    "Saved private description",
  );
  const hostile = await page.request.patch("/api/my-business/demo-amber-roof", {
    headers: { origin: config.APP_ORIGIN },
    data: { version: 1, details: { name: "Cannot claim a fixture" } },
  });
  expect(hostile.status()).toBe(404);
  const injection = await page.request.patch(`/api${path}`, {
    headers: { origin: config.APP_ORIGIN },
    data: {
      version: 2,
      details: { name: "Injected", lifecycleState: "published" },
    },
  });
  expect(injection.status()).toBe(400);
  const crossOrigin = await page.request.patch(`/api${path}`, {
    headers: { origin: "https://evil.invalid" },
    data: { version: 2, details: { name: "Injected" } },
  });
  expect(crossOrigin.status()).toBe(403);
  await page.context().clearCookies();
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: "Sign in to add your business" }),
  ).toBeVisible();
  await login(page);
  await page.goto(path);
  await expect(page.getByLabel("About your business")).toHaveValue(
    "Saved private description",
  );
  const result = await page.request.get(
    "/api/discovery?area=Uyo&q=Private+browser+business",
  );
  expect((await result.json()).businesses).toHaveLength(0);
});
for (const width of [320, 390, 768, 1280])
  test(`M25 Slice 1 screens at ${width}px`, async ({ page }) => {
    test.setTimeout(150000);
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await login(page);
    await page
      .getByRole("link", { name: "Screenshot private business", exact: true })
      .click();
    await expect(page).toHaveURL(/\/my-business\/[a-f0-9-]+$/, {
      timeout: 20000,
    });
    const draftPath = new URL(page.url()).pathname;
    const screens = [
      ["workspace", "/my-business"],
      ["draft", draftPath],
      ["register-unavailable", "/register"],
      ["verify-unavailable", "/verify-email"],
      ["recovery-unavailable", "/recover-account"],
      ["reset-unavailable", "/reset-password"],
      ["explore", "/?area=Uyo"],
    ];
    const evidence = [];
    mkdirSync(output, { recursive: true });
    for (const [name, path] of screens) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      expect(overflow).toBe(false);
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(axe.violations).toEqual([]);
      await page.screenshot({
        path: `${output}/${name}-${width}.png`,
        fullPage: true,
      });
      evidence.push({
        name,
        path,
        width,
        overflow,
        axeViolations: axe.violations.length,
      });
    }
    writeFileSync(
      `${output}/screens-${width}.json`,
      JSON.stringify(evidence, null, 2) + "\n",
    );
  });
test("M25 unavailable provider controls stay honest and keyboard accessible", async ({
  page,
}) => {
  await page.goto("/register");
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("not configured");
  expect(
    (
      await page.request.post("/api/auth/sign-up/email", {
        data: { email: "blocked@example.invalid", name: "Blocked", password },
      })
    ).status(),
  ).toBe(404);
  await page.goto("/sign-in");
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeDisabled();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("M25 private workspace shows safe database errors and retries after recovery", async ({
  page,
}) => {
  await login(page);
  await db.execute(
    sql`ALTER TABLE business_onboarding RENAME TO offline_onboarding`,
  );
  try {
    await page.goto("/my-business");
    await expect(
      page.getByRole("heading", { name: "Business workspace unavailable" }),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText("SELECT");
  } finally {
    await db.execute(
      sql`ALTER TABLE offline_onboarding RENAME TO business_onboarding`,
    );
  }
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "My Business", exact: true }),
  ).toBeVisible();
});
