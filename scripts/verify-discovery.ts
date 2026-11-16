import { spawn } from "node:child_process";
import { stopChild } from "./stop-child";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { connectDatabase } from "@/db/connection";
import { developmentBusiness, developmentPost } from "@/db/schema";
import { eq } from "drizzle-orm";
const output =
  process.env.DISCOVERY_EVIDENCE_DIR || "docs/evidence/staging-workflow-local";
const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
const { businesses, posts } = await (async () => {
  try {
    return {
      businesses: await db
        .select()
        .from(developmentBusiness)
        .where(eq(developmentBusiness.seedKey, "jado-m05-v1")),
      posts: await db
        .select()
        .from(developmentPost)
        .where(eq(developmentPost.seedKey, "jado-m05-v1")),
    };
  } finally {
    await pool.end();
  }
})();
assert.equal(businesses.length, 10);
assert.equal(posts.length, 20);
const origin = "http://localhost:3300";
const server = spawn(process.execPath, [".next/standalone/server.js"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: "3300",
    HOSTNAME: "127.0.0.1",
    APP_ORIGIN: "https://localhost:3300",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let spawnError: Error | undefined;
server.once("error", (error) => {
  spawnError = error;
});
server.stdout.resume();
server.stderr.resume();
const checks: string[] = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (spawnError)
      throw new Error("Verification server could not start.", {
        cause: spawnError,
      });
    if (server.exitCode !== null || server.signalCode !== null)
      throw new Error(
        "Verification server exited before startup completed. Check port 3300 and the standalone build.",
      );
    try {
      ready = (
        await fetch(origin + "/api/health", {
          signal: AbortSignal.timeout(5000),
        })
      ).ok;
    } catch {}
    if (ready) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  assert(ready, "Verification server did not become ready.");
  if (spawnError || server.exitCode !== null || server.signalCode !== null)
    throw new Error("Verification server exited during startup.");
  const data = await (await fetch(origin + "/api/discovery?area=Uyo")).json();
  assert.equal(data.businesses.length, 10);
  checks.push(
    "Anonymous normal discovery returns all ten SQL fixture businesses",
  );
  for (const q of [
    "Amber Roof Solar",
    "Solar and power",
    "inverter diagnostics",
    "ring light",
  ]) {
    const result = await (
      await fetch(origin + "/api/discovery?area=Uyo&q=" + encodeURIComponent(q))
    ).json();
    assert(result.businesses.length > 0);
    checks.push("Search: " + q);
  }
  assert.equal((await fetch(origin + "/api/me")).status, 401);
  checks.push("Anonymous account reads remain denied");
  const browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    for (const b of businesses) {
      await page.goto(origin + "/b/" + b.slug + "?area=Uyo");
      await expect(
        page.getByRole("heading", { name: b.name, exact: true }),
      ).toBeVisible();
    }
    checks.push("All ten normal profile routes open");
    await page.goto(origin + "/?area=Uyo");
    await page.locator(".business-card a").first().click();
    await expect(page).toHaveURL(/\/b\//);
    checks.push("Explore card opens profile");
    await page.goto(origin + "/feed?area=Uyo");
    assert((await page.locator(".post-card").count()) > 5);
    await page.locator('a[href*="/posts/"]').first().click();
    await expect(page).toHaveURL(/\/posts\//);
    checks.push("Populated Feed links to post detail");
    await page.goto(origin + "/search?area=Uyo&q=solar");
    await page.reload();
    await expect(page.locator(".business-card")).toHaveCount(3);
    await page.getByRole("checkbox").first().check();
    await expect(page).toHaveURL(/ids=demo-/);
    await page.reload();
    await expect(page.getByRole("checkbox").first()).toBeChecked();
    checks.push("Search refresh and compare selection persist in URL");
    for (const ids of [
      "demo-amber-roof,demo-daybreak",
      "demo-amber-roof,demo-daybreak,demo-sunward",
    ]) {
      await page.goto(origin + "/compare?area=Uyo&ids=" + ids);
      await expect(
        page.getByRole("heading", { name: "Side by side, your way." }),
      ).toBeVisible();
      await expect(page.locator(".desktop-comparison")).toContainText(
        "₦1,250,000",
      );
    }
    checks.push("Two/three business comparison renders seeded prices");
    mkdirSync(output, { recursive: true });
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      for (const [name, path] of Object.entries({
        explore: "/?area=Uyo",
        feed: "/feed?area=Uyo",
        search: "/search?area=Uyo&q=ring+light",
        profile: "/b/amber-roof?area=Uyo",
        compare:
          "/compare?area=Uyo&ids=demo-amber-roof,demo-daybreak,demo-sunward",
      })) {
        await page.goto(origin + path);
        await expect(page.getByText("Development data").first()).toBeVisible();
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page.screenshot({
          path: `${output}/${name}-${width}.png`,
          fullPage: true,
        });
      }
    }
    checks.push(
      "20 normal-route captures at 320/390/768/1280; labels and no page overflow",
    );
    await context.close();
  } finally {
    await browser.close();
  }
  writeFileSync(
    output + "/verification.json",
    JSON.stringify(
      {
        context:
          process.env.DISCOVERY_EVIDENCE_CONTEXT ||
          "Disposable local PostgreSQL; not live staging",
        application: "Local optimised runtime, normal routes",
        businesses: businesses.map((b) => ({ id: b.id, slug: b.slug })),
        posts: posts.length,
        checks,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await stopChild(server);
}
console.log(
  `Verification passed (${checks.length} checks): 10 businesses found; Feed populated; Search working; profiles working; Compare working.`,
);
