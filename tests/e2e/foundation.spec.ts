import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { eq } from "drizzle-orm";
import { connectDatabase } from "@/db/connection";
import { mutationLimit, rateLimit, user } from "@/db/schema";

const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
test.beforeEach(async () => {
  await db.delete(rateLimit);
  await db.delete(mutationLimit);
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
test("anonymous browse, authentication gate and unavailable auth flows", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Where are you looking?",
  );
  await page.getByRole("link", { name: "Account", exact: true }).click();
  await expect(page).toHaveURL("/account");
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/sign-in\?next=/);
  expect((await page.request.get("/api/me")).status()).toBe(401);
  expect((await page.request.get("/api/auth/get-session")).status()).toBe(401);
  expect((await page.request.get("/api/admin/status")).status()).toBe(401);
  expect(
    (
      await page.request.patch("/api/account/name", {
        data: { name: "Denied" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (await page.request.post("/api/auth/sign-up/email", { data: {} })).status(),
  ).toBe(404);
  expect(
    (
      await page.request.post("/api/auth/update-user", {
        data: { role: "admin" },
      })
    ).status(),
  ).toBe(404);
});
test("sign in, persist a name, refresh and sign out through the UI", async ({
  page,
}) => {
  await page.goto("/sign-in?next=/account");
  await page.getByLabel("Email address").fill("consumer@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.DEV_SEED_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/account");
  await expect(
    page.getByText("Development fixture", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Your name").fill("[DEV FIXTURE] Updated consumer");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("status")).toHaveText("Name saved.");
  await page.reload();
  await expect(page.getByLabel("Your name")).toHaveValue(
    "[DEV FIXTURE] Updated consumer",
  );
  expect(
    await page.evaluate(() => document.cookie.includes("session_token")),
  ).toBe(false);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL("/sign-in");
  expect((await page.request.get("/api/me")).status()).toBe(401);
});
test("wrong password displays an honest failure", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill("consumer@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("not-the-seed-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Sign-in failed" }),
  ).toContainText("Sign-in failed");
});
test("consumer cannot open the staff area; admin can", async ({ page }) => {
  await login(page);
  expect((await page.request.get("/api/admin/status")).status()).toBe(403);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Access unavailable" }),
  ).toBeVisible();
  await page.context().clearCookies();
  await login(page, "admin@example.invalid");
  expect((await page.request.get("/api/admin/status")).status()).toBe(200);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Staff access confirmed" }),
  ).toBeVisible();
});
test("mutation checks origin, input, size and privilege fields", async ({
  page,
}) => {
  await login(page);
  const update = (data: unknown, origin = "http://localhost:3100") =>
    page.request.patch("/api/account/name", { headers: { origin }, data });
  expect(
    (await update({ name: "Denied" }, "https://evil.invalid")).status(),
  ).toBe(403);
  expect(
    (
      await page.request.patch("/api/account/name", {
        data: { name: "No origin" },
      })
    ).status(),
  ).toBe(403);
  expect((await update({ name: "" })).status()).toBe(400);
  expect((await update({ name: "Name", role: "admin" })).status()).toBe(400);
  expect((await update({ name: "x".repeat(5000) })).status()).toBe(413);
  expect((await page.request.get("/api/admin/status")).status()).toBe(403);
});
test("suspension takes effect for an already signed-in browser", async ({
  page,
}) => {
  await login(page);
  await db
    .update(user)
    .set({ state: "suspended" })
    .where(eq(user.id, "dev-consumer"));
  try {
    expect((await page.request.get("/api/me")).status()).toBe(403);
    expect(
      (
        await page.request.patch("/api/account/name", {
          headers: { origin: "http://localhost:3100" },
          data: { name: "Denied" },
        })
      ).status(),
    ).toBe(403);
    await page.goto("/account");
    await expect(
      page.getByRole("heading", { name: "Account unavailable" }),
    ).toBeVisible();
  } finally {
    await db
      .update(user)
      .set({ state: "active" })
      .where(eq(user.id, "dev-consumer"));
  }
});
test("handles offline sign-in without a false success", async ({ page }) => {
  await page.goto("/sign-in");
  await page.route("**/api/auth/sign-in/email", (route) => route.abort());
  await page.getByLabel("Email address").fill("consumer@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("offline-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Could not connect" }),
  ).toContainText("Could not connect");
});
for (const width of [320, 390, 768, 1280]) {
  test(`layout and keyboard navigation at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/sign-in"]) {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(
          `${path === "/" ? "home" : "sign-in"}-${width}.png`,
        ),
        fullPage: true,
      });
    }
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to content" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
    await page.goto("/sign-in");
    await page.getByLabel("Email address").press("Tab");
    await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeFocused();
    await login(page, "admin@example.invalid");
    for (const path of ["/account", "/admin"]) {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
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
        path: testInfo.outputPath(`${path.slice(1)}-${width}.png`),
        fullPage: true,
      });
    }
  });
}
test("not-found screen and security headers", async ({ page }) => {
  const response = await page.goto("/missing-page");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "We couldn’t find that page." }),
  ).toBeVisible();
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
});
