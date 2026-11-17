import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { connectDatabase } from "@/db/connection";
import { user, rateLimit } from "@/db/schema";
import { createAuth } from "@/server/auth";
import { readConfig } from "@/lib/config";
import {
  createBusinessDraft,
  listBusinessDrafts,
} from "@/server/business-drafts";
const { db, pool } = connectDatabase(process.env.DATABASE_URL!),
  config = readConfig();
const email = "gbp-slice2@example.invalid",
  password = "Gbp-browser-password-012345!";
let otp = "",
  id = "";
// Test-only sender creates a genuinely verified Better Auth account on an isolated database.
const auth = createAuth(
  db,
  config,
  false,
  {
    available: true,
    async send(message) {
      otp = message.text.match(/\b\d{6}\b/)![0];
    },
  },
  {},
);
const output = "docs/evidence/m25-slice2";
test.beforeAll(async () => {
  async function post(path: string, data: unknown) {
    expect(
      (
        await auth.handler(
          new Request(`${config.APP_ORIGIN}/api/auth${path}`, {
            method: "POST",
            headers: {
              origin: config.APP_ORIGIN,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }),
        )
      ).status,
    ).toBe(200);
  }
  let principal = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (!principal) {
    await post("/sign-up/email", {
      name: "Slice 2 applicant",
      email,
      password,
    });
    await post("/email-otp/verify-email", { email, otp });
    principal = await db.query.user.findFirst({ where: eq(user.email, email) });
  }
  if (!principal?.emailVerified)
    throw new Error("Automated browser account must complete verification");
  const existing = (await listBusinessDrafts(db, principal)).find(
    (d) => d.details.name === "Slice 2 private energy",
  );
  id =
    existing?.id ||
    (
      await createBusinessDraft(
        db,
        principal,
        {
          name: "Slice 2 private energy",
          description:
            "Private draft retained while Google approval is pending",
          serviceArea: "Uyo",
        },
        "browser-setup",
      )
    ).id;
});
test.beforeEach(async () => {
  await db.delete(rateLimit);
});
test.afterAll(async () => {
  await pool.end();
});
async function login(page: Page) {
  expect(
    (
      await page.request.post("/api/auth/sign-in/email", {
        headers: { origin: config.APP_ORIGIN },
        data: { email, password },
      })
    ).status(),
  ).toBe(200);
}
test("GBP endpoints preserve sign-in, origin, input and fixture boundaries", async ({
  page,
}) => {
  expect((await page.request.get(`/api/my-business/${id}/gbp`)).status()).toBe(
    401,
  );
  await login(page);
  expect(
    (
      await page.request.post(`/api/my-business/${id}/gbp/connect`, {
        headers: { origin: "https://evil.invalid" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post(`/api/my-business/${id}/gbp`, {
        headers: { origin: config.APP_ORIGIN },
        data: {
          action: "select",
          account: "accounts/1",
          location: "locations/1",
          role: "owner",
          voiceOfMerchant: true,
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.post(`/api/my-business/demo-amber-roof/gbp/connect`, {
        headers: { origin: config.APP_ORIGIN },
        data: {},
      })
    ).status(),
  ).toBe(404);
  const pending = await page.request.post(
    `/api/my-business/${id}/gbp/connect`,
    { headers: { origin: config.APP_ORIGIN }, data: {} },
  );
  expect(pending.status()).toBe(200);
  expect(await pending.json()).toEqual({
    pending: true,
    reason: "ACCESS_PENDING",
  });
  expect(pending.headers()["set-cookie"]).toBeUndefined();
  const status = await page.request.get(`/api/my-business/${id}/gbp`),
    data = await status.json();
  expect(data.available).toBe(false);
  expect(data.connection).toBe("not_connected");
  expect(JSON.stringify(data)).not.toMatch(
    /cipher|refreshToken|clientSecret|accessToken/,
  );
  expect(
    (
      await page.request.get(
        `/api/my-business/${id}/gbp?provider=mock&verified=true`,
      )
    ).status(),
  ).toBe(400);
  const callback = await page.request.get(
    "/api/gbp/oauth/callback?state=invalid&code=forged",
  );
  expect(callback.status()).toBe(400);
  expect(callback.headers()["referrer-policy"]).toBe("no-referrer");
  expect(await callback.text()).not.toContain("forged");
});
test("pending Google authorization cannot be enabled by cookies or URL and drafts remain resumable", async ({
  page,
  context,
}) => {
  await login(page);
  await context.addCookies([
    { name: "GBP_PROVIDER_MODE", value: "mock", url: config.APP_ORIGIN },
  ]);
  await page.goto(`/my-business/${id}?provider=live&verified=true`);
  await expect(
    page.getByRole("button", { name: "Google connection unavailable" }),
  ).toBeDisabled();
  await expect(
    page.getByText("No public listing or verification badge is created here.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByLabel("About your business")
    .fill("Resumable even while GBP access is pending");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  await expect(page.getByLabel("About your business")).toHaveValue(
    "Resumable even while GBP access is pending",
  );
  const discovery = await page.request.get(
    "/api/discovery?area=Uyo&q=Slice+2+private+energy",
  );
  expect((await discovery.json()).businesses).toHaveLength(0);
});
for (const width of [320, 390, 768, 1280])
  test(`Slice 2 and preserved discovery at ${width}px`, async ({ page }) => {
    test.setTimeout(180000);
    await login(page);
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    mkdirSync(output, { recursive: true });
    const screens = [
      ["connection-pending", `/my-business/${id}`],
      ["workspace", "/my-business"],
      ["explore", "/?area=Uyo"],
      ["feed", "/feed?area=Uyo"],
      ["profile", "/b/amber-roof?area=Uyo"],
      [
        "compare",
        "/compare?area=Uyo&ids=demo-amber-roof,demo-daybreak,demo-sunward",
      ],
      ["gallery", "/design"],
    ];
    const evidence = [];
    for (const [name, path] of screens) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      if (name === "connection-pending")
        await expect(
          page.getByRole("button", { name: "Google connection unavailable" }),
        ).toBeDisabled();
      const images = page.locator("img:visible");
      for (let i = 0; i < (await images.count()); i++) {
        await images.nth(i).scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            images
              .nth(i)
              .evaluate(
                (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
              ),
          )
          .toBe(true);
      }
      await page.evaluate(() => {
        document
          .querySelectorAll<HTMLElement>(
            ".feature-grid,.category-row,.profile-tabs,.compare-facts",
          )
          .forEach((el) => {
            el.style.scrollBehavior = "auto";
            el.scrollLeft = 0;
          });
        window.scrollTo(0, 0);
      });
      await expect
        .poll(() =>
          page.evaluate(() =>
            Array.from(
              document.querySelectorAll<HTMLElement>(".compare-facts"),
            ).every((el) => el.scrollLeft === 0),
          ),
        )
        .toBe(true);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      expect(overflow).toBe(false);
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(audit.violations).toEqual([]);
      await page.screenshot({
        path: `${output}/${name}-${width}.png`,
        fullPage: true,
      });
      evidence.push({
        name,
        path:
          name === "connection-pending" ? "/my-business/[private-id]" : path,
        width,
        overflow,
        brokenImages: 0,
        axeViolations: audit.violations.length,
      });
    }
    writeFileSync(
      `${output}/screens-${width}.json`,
      JSON.stringify(evidence, null, 2) + "\n",
    );
  });
test("GBP workspace stays keyboard accessible and gives safe unauthorized recovery", async ({
  page,
}) => {
  await login(page);
  await page.goto(`/my-business/${id}`);
  await page.getByLabel("About your business").focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toBeFocused();
  await page.context().clearCookies();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Sign in to add your business" }),
  ).toBeVisible();
});

// A single, explicitly illustrative gallery: never a fake verified business.
for (const width of [320, 390, 768, 1280])
  test(`GBP component state gallery at ${width}px`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/design");
    await expect(
      page.getByRole("heading", { name: "GBP connection states", exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByText(
        "Component examples only. These states do not represent a connected or verified business.",
        { exact: true },
      ),
    ).toBeVisible();
    const images = page.locator("img:visible");
    for (let i = 0; i < (await images.count()); i++) {
      await images.nth(i).scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          images
            .nth(i)
            .evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
            ),
        )
        .toBe(true);
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
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    mkdirSync(output, { recursive: true });
    await page.screenshot({
      path: `${output}/gallery-${width}.png`,
      fullPage: true,
    });
    const file = `${output}/screens-${width}.json`,
      measurements = JSON.parse(readFileSync(file, "utf8"));
    const row = measurements.find(
      (entry: { name: string }) => entry.name === "gallery",
    );
    row.componentExamplesLabeled = true;
    writeFileSync(file, JSON.stringify(measurements, null, 2) + "\n");
  });
