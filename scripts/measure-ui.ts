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
const output = process.env.PERF_OUTPUT_DIR ?? "docs/evidence/m05";
try {
  for (const path of [
    "/?area=Uyo",
    "/feed?area=Uyo",
    "/b/amber-roof?area=Uyo",
    "/search?area=Uyo&q=solar",
    "/compare?area=Uyo&ids=demo-amber-roof,demo-daybreak,demo-sunward",
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
    const images = new Map<string, number>();
    const jobs: Promise<void>[] = [];
    const destinations = new Set<string>();
    page.on("request", (r) => destinations.add(new URL(r.url()).origin));
    page.on("response", (r) => {
      if (r.request().resourceType() === "image")
        jobs.push(
          r.body().then((body) => {
            images.set(r.url(), body.byteLength);
          }),
        );
      if (r.request().resourceType() === "script")
        jobs.push(
          r.body().then((body) => {
            scripts.set(r.url(), gzipSync(body).byteLength);
          }),
        );
    });
    await page.addInitScript(() => {
      const results = {
        lcp: 0,
        cls: 0,
        lcpSource: "",
        shifts: [] as { value: number; nodes: string[] }[],
      };
      Object.assign(window, { jadoPerformance: results });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          results.lcp = entry.startTime;
          results.lcpSource = (
            (entry as PerformanceEntry & { element?: HTMLImageElement }).element
              ?.currentSrc ?? ""
          ).replace(location.origin, "");
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (
            !(entry as PerformanceEntry & { hadRecentInput: boolean })
              .hadRecentInput
          ) {
            results.shifts.push({
              value: (entry as PerformanceEntry & { value: number }).value,
              nodes: (
                (entry as PerformanceEntry & { sources?: { node?: Element }[] })
                  .sources ?? []
              ).map((s) => s.node?.tagName + "." + s.node?.className),
            });
            results.cls += (
              entry as PerformanceEntry & { value: number }
            ).value;
          }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(`${origin}${path}`, { waitUntil: "load", timeout: 60000 });
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
      imageRequests: images.size,
      imageBytes: [...images.values()].reduce((a, b) => a + b, 0),
      brokenImages: await page
        .locator("img:visible")
        .evaluateAll(
          (imgs) =>
            imgs.filter(
              (img) =>
                (img as HTMLImageElement).complete &&
                (img as HTMLImageElement).naturalWidth === 0,
            ).length,
        ),
      thirdPartyOrigins: [...destinations].filter((x) => x !== origin),
    });
    await context.close();
  }
} finally {
  await browser.close();
}
mkdirSync(output, { recursive: true });
const result = {
  runtime:
    "Optimised runtime; discovery reflects records present in the configured database.",
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
  `${output}/performance.json`,
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
