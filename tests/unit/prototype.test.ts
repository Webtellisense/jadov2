import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { assertPrototypeSeedAllowed } from "@/db/prototype-guard";
import { comparisonIds, parseFilters, money } from "@/lib/discovery";
it("seed requires explicit opt-in and accepts an ordinary hosted staging URL", () => {
  const env = {
    ALLOW_DEV_SEED: "true",
    DATABASE_URL: "postgresql://staging@host.example.invalid/postgres",
    NODE_ENV: "production",
  };
  expect(() => assertPrototypeSeedAllowed(env)).not.toThrow();
  expect(() =>
    assertPrototypeSeedAllowed({ ...env, ALLOW_DEV_SEED: "false" }),
  ).toThrow();
  expect(() =>
    assertPrototypeSeedAllowed({ ...env, DATABASE_URL: "" }),
  ).toThrow();
});
describe("validated prototype input", () => {
  it("parses only known fields and bounds query size", () => {
    expect(
      parseFilters({ q: " ring light ", area: "Uyo", demo: "true" }).q,
    ).toBe("ring light");
    expect(() => parseFilters({ q: "a".repeat(121) })).toThrow();
    expect(() => parseFilters({ area: "Unknown" })).toThrow();
  });
  it("rejects invalid sorts and SQL-like category input", () => {
    expect(() => parseFilters({ sort: "trending" })).toThrow();
    expect(() => parseFilters({ category: "solar' OR 1=1" })).toThrow();
  });
  it("permits zero to three distinct opaque fixture identifiers", () => {
    expect(comparisonIds("")).toEqual([]);
    expect(comparisonIds("demo-a,demo-b,demo-c")).toHaveLength(3);
    for (const ids of [
      "demo-a,demo-a",
      "demo-a,demo-b,demo-c,demo-d",
      "<script>",
    ])
      expect(() => comparisonIds(ids)).toThrow();
  });
  it("never invents a missing price", () => {
    expect(money(null)).toBe("Not listed");
    expect(money(1250000)).toBe("₦1,250,000");
  });
});
const css = readFileSync("styles/tokens.css", "utf8");
const palette = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6}|#fff)\s*;/gi)].map((m) => [
    m[1],
    m[2].length === 4 ? "#ffffff" : m[2],
  ]),
);
function luminance(hex: string) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
for (const [foreground, background] of [
  ["ink-900", "bg"],
  ["ink-500", "surface"],
  ["ink-900", "sunrise-500"],
  ["surface", "whatsapp-600"],
  ["surface", "teal-600"],
  ["surface", "coral-600"],
  ["warning-text", "warning-bg"],
  ["warning-text", "surface"],
  ["danger-text", "coral-100"],
  ["ink-500", "sunrise-100"],
  ["ink-500", "beauty-tint"],
  ["ink-500", "home-tint"],
  ["ink-500", "education-tint"],
  ["ink-500", "fashion-tint"],
  ["success-text", "success-bg"],
])
  it(`AA contrast: ${foreground} on ${background}`, () => {
    const a = luminance(palette[foreground]),
      b = luminance(palette[background]);
    expect(
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    ).toBeGreaterThanOrEqual(4.5);
  });
