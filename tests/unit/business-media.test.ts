import { it, expect } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import {
  fixturePresentation,
  fixturePostPresentation,
} from "@/db/prototype-presentation";
import {
  businessPresentationSchema,
  validatePostPresentation,
  postMediaLimits,
} from "@/lib/business-media";
import { prototypeIds } from "@/db/prototype-data";
it("all ten identities have original local media and complete representative fields", () => {
  const logos = new Set<string>();
  prototypeIds.forEach((id, index) => {
    const slug = id.slice(5);
    const p = fixturePresentation(
      slug,
      "Business",
      "Area",
      "Service",
      index ? 12500 : null,
      index,
    );
    expect(p.gallery.length).toBeGreaterThanOrEqual(3);
    expect(p.services).toHaveLength(2);
    expect(p.address).toContain("Uyo");
    expect(p.hours.length).toBeGreaterThan(0);
    logos.add(readFileSync("public" + p.logo, "utf8"));
    for (const photo of p.gallery) {
      expect(existsSync("public" + photo.src)).toBe(true);
      expect(
        existsSync("public" + photo.src.replace(".webp", "-small.webp")),
      ).toBe(true);
      expect(statSync("public" + photo.src).size).toBeLessThan(60000);
    }
  });
  expect(logos.size).toBe(10);
});
it("rejects external media and genuine contact destinations in the fixture contract", () => {
  const p = fixturePresentation(
    "amber-roof",
    "Name",
    "Area",
    "Service",
    null,
    0,
  );
  expect(() =>
    businessPresentationSchema.parse({
      ...p,
      website: "https://real-business.com",
    }),
  ).toThrow();
  expect(() =>
    businessPresentationSchema.parse({
      ...p,
      cover: { src: "https://remote.example/picture.jpg", alt: "A photo" },
    }),
  ).toThrow();
});
it("enforces each post type media limit including negative paths", () => {
  const p = fixturePresentation("daybreak", "Name", "Area", "Service", 100, 1);
  for (const [type, limit] of Object.entries(postMediaLimits)) {
    expect(() =>
      validatePostPresentation(type as keyof typeof postMediaLimits, {
        media: p.gallery.slice(0, limit),
        eventAt: null,
      }),
    ).not.toThrow();
    expect(() =>
      validatePostPresentation(type as keyof typeof postMediaLimits, {
        media: Array(limit + 1).fill(p.gallery[0]),
        eventAt: null,
      }),
    ).toThrow();
  }
  expect(fixturePostPresentation("portfolio", p.gallery, 1).media).toHaveLength(
    5,
  );
});
