import { beforeAll, afterAll, it, expect } from "vitest";
import { eq, sql } from "drizzle-orm";
import { connectDatabase } from "@/db/connection";
import {
  developmentBusiness,
  developmentCategory,
  developmentPost,
  business,
  user,
} from "@/db/schema";
import {
  seedPrototype,
  undoPrototype,
  prototypeIds,
} from "@/db/prototype-data";
import { seedDevelopment } from "@/db/seed-data";
import { readPrototype } from "@/server/prototype-repository";
import { parseFilters } from "@/lib/discovery";
const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
const query = (values: Record<string, string> = {}) =>
  readPrototype(db, parseFilters({ area: "Uyo", ...values }));
beforeAll(async () => {
  await seedDevelopment(db);
  await seedPrototype(db);
});
afterAll(async () => {
  await undoPrototype(db);
  await pool.end();
});
it("idempotently seeds exactly ten fictional businesses and all six post types", async () => {
  await seedPrototype(db);
  await seedPrototype(db);
  const rows = await db.select().from(developmentBusiness);
  expect(rows).toHaveLength(10);
  expect(rows.map((r) => r.id).sort()).toEqual([...prototypeIds].sort());
  expect(rows.every((r) => r.seedKey === "jado-m05-v1")).toBe(true);
  const posts = await db.select().from(developmentPost);
  expect(posts).toHaveLength(20);
  expect(posts.every((p) => !p.expiresAt || p.expiresAt > p.publishedAt)).toBe(
    true,
  );
  expect(new Set(posts.map((p) => p.type)).size).toBe(6);
  expect(
    (await db.select().from(business)).every((b) => b.status === "pending"),
  ).toBe(true);
});
it("searches persisted products and tags instead of card arrays", async () => {
  const result = await query({ q: "ring light" });
  expect(result.businesses.map((b) => b.name)).toEqual(["Pocket Beam Supply"]);
  await db
    .update(developmentBusiness)
    .set({ name: "Pocket Beam Changed" })
    .where(eq(developmentBusiness.id, "demo-pocket-beam"));
  expect((await query({ q: "ring light" })).businesses[0].name).toBe(
    "Pocket Beam Changed",
  );
  await db
    .update(developmentBusiness)
    .set({ name: "Pocket Beam Supply" })
    .where(eq(developmentBusiness.id, "demo-pocket-beam"));
});
it("applies category, area, type and current-offer filters in SQL", async () => {
  expect((await query({ category: "solar" })).businesses).toHaveLength(3);
  expect((await query({ area: "Eket" })).businesses).toHaveLength(0);
  expect((await query({ area: "" })).businesses).toHaveLength(0);
  const offers = await query({ category: "solar", offers: "yes" });
  expect(offers.businesses).toHaveLength(2);
  expect(offers.businesses.some((b) => b.id === "demo-sunward")).toBe(false);
  expect((await query({ type: "event" })).businesses.length).toBeGreaterThan(0);
});
it("returns honest empty results and treats wildcard/injection input literally", async () => {
  for (const q of ["unlisted item", "%", "_", "' OR 1=1 --"])
    expect((await query({ q })).businesses).toHaveLength(0);
});
it("sorts from stored names, creation dates and sample post timestamps", async () => {
  expect((await query({ sort: "name" })).businesses[0].name).toBe(
    "Amber Roof Solar",
  );
  expect((await query({ sort: "newest" })).businesses[0].id).toBe(
    "demo-amber-roof",
  );
  const active = await query({ sort: "active" });
  expect(active.businesses).toHaveLength(10);
});
it("supports anonymous database-backed discovery without environment switches", async () => {
  expect((await query()).businesses).toHaveLength(10);
  for (const q of [
    "Amber Roof Solar",
    "Solar and power",
    "inverter diagnostics",
    "18-inch ring light kit",
  ])
    expect((await query({ q })).businesses.length).toBeGreaterThan(0);
});
it("fails closed on seed collisions without partial changes", async () => {
  await db
    .update(developmentCategory)
    .set({ seedKey: "foreign" })
    .where(eq(developmentCategory.id, "solar"));
  try {
    await expect(seedPrototype(db)).rejects.toThrow("collision");
    expect(await db.select().from(developmentBusiness)).toHaveLength(10);
  } finally {
    await db
      .update(developmentCategory)
      .set({ seedKey: "jado-m05-v1" })
      .where(eq(developmentCategory.id, "solar"));
  }
});
it("refuses seed and undo without explicit opt-in", async () => {
  await expect(
    seedPrototype(db, { ...process.env, ALLOW_DEV_SEED: "false" }),
  ).rejects.toThrow();
  await expect(
    undoPrototype(db, { ...process.env, ALLOW_DEV_SEED: "false" }),
  ).rejects.toThrow();
});
it("enforces relational ownership and allowed post types", async () => {
  await expect(
    db.execute(
      sql`insert into development_post (id,business_id,type,title,description,tags,published_at,seed_key) values ('bad','missing','offer','bad','bad','{}',now(),'jado-m05-v1')`,
    ),
  ).rejects.toHaveProperty("cause.code", "23503");
  await expect(
    db.execute(
      sql`update development_post set type='personal_status' where id='demo-amber-roof-post'`,
    ),
  ).rejects.toHaveProperty("cause.code", "23514");
});
it("undo removes only the prototype namespace, preserves M0 and supports reseeding", async () => {
  const m0 = await db.select().from(business);
  const users = await db.select().from(user);
  await undoPrototype(db);
  await undoPrototype(db);
  expect(await db.select().from(developmentBusiness)).toHaveLength(0);
  expect(await db.select().from(developmentPost)).toHaveLength(0);
  expect(await db.select().from(business)).toEqual(m0);
  expect((await db.select().from(user)).map((u) => u.id).sort()).toEqual(
    users.map((u) => u.id).sort(),
  );
  await seedPrototype(db);
  expect((await query()).businesses).toHaveLength(10);
});

it("seed and undo preserve genuine businesses while coexisting", async () => {
  await db
    .insert(business)
    .values({
      id: "real-staging",
      slug: "real-staging",
      googlePlaceId: "test-real-id",
      isFixture: false,
      status: "pending",
    });
  try {
    await seedPrototype(db);
    await undoPrototype(db);
    expect(
      await db.select().from(business).where(eq(business.id, "real-staging")),
    ).toHaveLength(1);
    await seedPrototype(db);
  } finally {
    await db.delete(business).where(eq(business.id, "real-staging"));
  }
});
