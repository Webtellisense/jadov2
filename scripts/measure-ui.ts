import { chromium } from "@playwright/test";
import { gzipSync } from "node:zlib";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
const origin = process.env.PERF_ORIGIN ?? "http://localhost:3200";
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
const measurements = [];
try {
  for (const path of [
    "/?area=Uyo",
    "/location",
    "/search?area=Uyo&q=solar",
    "/compare?area=Uyo",
  ]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 200000,
      uploadThroughput: 93750,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const scripts = new Map<string, number>();
    const jobs: Promise<void>[] = [];
    const destinations = new Set<string>();
    page.on("request", (r) => destinations.add(new URL(r.url()).origin));
    page.on("response", (r) => {
      if (r.request().resourceType() === "script")
        jobs.push(
          r.body().then((body) => {
            scripts.set(r.url(), gzipSync(body).byteLength);
          }),
        );
    });
    await page.addInitScript(() => {
      const results = { lcp: 0, cls: 0 };
      Object.assign(window, { jadoPerformance: results });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) results.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (
            !(entry as PerformanceEntry & { hadRecentInput: boolean })
              .hadRecentInput
          )
            results.cls += (
              entry as PerformanceEntry & { value: number }
            ).value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(3000);
    await Promise.all(jobs);
    const metrics = await page.evaluate(() => {
      const metrics = (
        window as typeof window & {
          jadoPerformance: { lcp: number; cls: number };
        }
      ).jadoPerformance;
      return {
        ...metrics,
        navigationMs: performance.getEntriesByType("navigation")[0]?.duration,
      };
    });
    measurements.push({
      path,
      viewport: "390x844",
      ...metrics,
      initialJavascriptGzipBytes: [...scripts.values()].reduce(
        (a, b) => a + b,
        0,
      ),
      scriptFiles: scripts.size,
      thirdPartyOrigins: [...destinations].filter((x) => x !== origin),
    });
    await context.close();
  }
} finally {
  await browser.close();
}
mkdirSync("docs/evidence/m05", { recursive: true });
const result = {
  runtime:
    "Optimised local production build, public empty data only; development preview is deliberately disabled in production.",
  profile: {
    cpuSlowdown: 4,
    latencyMs: 150,
    downloadBytesPerSecond: 200000,
    uploadBytesPerSecond: 93750,
    coldBrowserContext: true,
  },
  measurements,
};
writeFileSync(
  "docs/evidence/m05/performance.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
