import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { connectDatabase } from "@/db/connection";
import {
  account,
  auditLog,
  business,
  membership,
  mutationLimit,
  rateLimit,
  session,
  user,
} from "@/db/schema";
import { seedDevelopment, undoDevelopmentSeed } from "@/db/seed-data";
import { createAuth } from "@/server/auth";
import {
  assertRole,
  requireBusinessAccess,
  requirePrincipal,
} from "@/server/authorization";
import { updateName } from "@/server/account";
import { readConfig } from "@/lib/config";

const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
const config = readConfig();
const auth = createAuth(db, config, false);
const consumerEmail = "consumer@example.invalid";
async function signIn(
  email = consumerEmail,
  password = process.env.DEV_SEED_PASSWORD!,
  instance = auth,
) {
  return instance.handler(
    new Request(`${config.APP_ORIGIN}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        origin: config.APP_ORIGIN,
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }),
  );
}
async function loginHeaders(email = consumerEmail) {
  const response = await signIn(email);
  expect(response.status).toBe(200);
  const cookies = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return new Headers({ cookie: cookies });
}
beforeAll(async () => {
  await seedDevelopment(db);
});
beforeEach(async () => {
  await db.delete(rateLimit);
  await db.delete(mutationLimit);
  await db.delete(auditLog);
  await db
    .update(user)
    .set({ state: "active", role: "consumer", name: "[DEV FIXTURE] Consumer" })
    .where(eq(user.id, "dev-consumer"));
});
afterAll(async () => {
  await pool.end();
});

describe("PostgreSQL persistence and seeds", () => {
  it("has the migration history and expected tables", async () => {
    const result = await db.execute(
      sql`select count(*)::int as count from drizzle.__drizzle_migrations`,
    );
    expect(result.rows[0].count).toBe(3);
  });
  it("repeats the dev seed without duplicating users, credentials or businesses", async () => {
    await seedDevelopment(db);
    await seedDevelopment(db);
    expect((await db.select().from(user)).length).toBe(2);
    expect((await db.select().from(account)).length).toBe(2);
    const rows = await db.select().from(business);
    expect(rows.length).toBe(1);
    expect(rows[0].isFixture).toBe(true);
    expect(rows[0].status).toBe("pending");
  });
  it("enforces unique Google Place IDs", async () => {
    await expect(
      db
        .insert(business)
        .values({
          id: "duplicate-place",
          googlePlaceId: "DEV_FIXTURE_NOT_A_GOOGLE_PLACE",
          slug: "duplicate-place",
          isFixture: true,
        }),
    ).rejects.toHaveProperty("cause.code", "23505");
  });
  it("rolls back a failed transaction", async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx
          .update(user)
          .set({ name: "Should roll back" })
          .where(eq(user.id, "dev-consumer"));
        throw new Error("rollback-test");
      }),
    ).rejects.toThrow("rollback-test");
    expect(
      (await db.query.user.findFirst({ where: eq(user.id, "dev-consumer") }))
        ?.name,
    ).toBe("[DEV FIXTURE] Consumer");
  });
});
describe("real credential sessions and authorization", () => {
  it("does not authenticate an anonymous or forged cookie", async () => {
    await expect(
      requirePrincipal(db, auth, new Headers()),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      requirePrincipal(
        db,
        auth,
        new Headers({ cookie: "better-auth.session_token=forged" }),
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("rejects cross-site credential requests", async () => {
    const response = await auth.handler(
      new Request(`${config.APP_ORIGIN}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          origin: "https://evil.invalid",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: consumerEmail,
          password: process.env.DEV_SEED_PASSWORD,
        }),
      }),
    );
    expect(response.status).toBe(403);
  });
  it("authenticates a seeded credential and sets an HttpOnly cookie", async () => {
    const response = await signIn();
    expect(response.status).toBe(200);
    expect(
      response.headers
        .getSetCookie()
        .some(
          (value) => /httponly/i.test(value) && /samesite=lax/i.test(value),
        ),
    ).toBe(true);
    expect((await requirePrincipal(db, auth, await loginHeaders())).id).toBe(
      "dev-consumer",
    );
  });
  it("rejects an incorrect password and never creates a session", async () => {
    const before = (await db.select().from(session)).length;
    const response = await signIn(
      consumerEmail,
      randomBytes(24).toString("hex"),
    );
    expect(response.status).toBe(401);
    expect((await db.select().from(session)).length).toBe(before);
  });
  it("denies the wrong platform role and accepts an actual administrator session", async () => {
    const consumer = await requirePrincipal(db, auth, await loginHeaders());
    expect(() => assertRole(consumer, "admin")).toThrow();
    expect(() =>
      assertRole({ ...consumer, role: "admin" }, "admin"),
    ).not.toThrow();
    const admin = await requirePrincipal(
      db,
      auth,
      await loginHeaders("admin@example.invalid"),
    );
    expect(admin.role).toBe("admin");
  });
  it("reads suspension from the database even for an existing session", async () => {
    const headers = await loginHeaders();
    await db
      .update(user)
      .set({ state: "suspended" })
      .where(eq(user.id, "dev-consumer"));
    await expect(requirePrincipal(db, auth, headers)).rejects.toMatchObject({
      status: 403,
    });
    expect((await signIn()).status).toBe(403);
  });
  it("invalidates an expired session", async () => {
    const headers = await loginHeaders();
    await db
      .update(session)
      .set({ expiresAt: new Date(0) })
      .where(eq(session.userId, "dev-consumer"));
    await expect(requirePrincipal(db, auth, headers)).rejects.toMatchObject({
      status: 401,
    });
  });
  it("revokes a session through the real sign-out handler", async () => {
    const headers = await loginHeaders();
    headers.set("origin", config.APP_ORIGIN);
    headers.set("content-type", "application/json");
    expect(
      (
        await auth.handler(
          new Request(`${config.APP_ORIGIN}/api/auth/sign-out`, {
            method: "POST",
            headers,
            body: "{}",
          }),
        )
      ).status,
    ).toBe(200);
    await expect(requirePrincipal(db, auth, headers)).rejects.toMatchObject({
      status: 401,
    });
  });
  it("rejects development identities in production authentication", async () => {
    const productionAuth = createAuth(
      db,
      { ...config, APP_ORIGIN: "https://jado.example.invalid" },
      true,
    );
    const response = await productionAuth.handler(
      new Request("https://jado.example.invalid/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          origin: "https://jado.example.invalid",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: consumerEmail,
          password: process.env.DEV_SEED_PASSWORD,
        }),
      }),
    );
    expect(response.status).toBe(403);
  });
  it("rate limits repeated credential attempts using persistent storage", async () => {
    const password = randomBytes(24).toString("hex");
    for (let attempt = 0; attempt < 5; attempt++)
      expect((await signIn(consumerEmail, password)).status).toBe(401);
    expect((await signIn(consumerEmail, password)).status).toBe(429);
    expect((await db.select().from(rateLimit)).length).toBeGreaterThan(0);
  });
});
describe("per-business boundaries", () => {
  it("does not grant a platform admin business privileges", async () => {
    const admin = await requirePrincipal(
      db,
      auth,
      await loginHeaders("admin@example.invalid"),
    );
    await expect(
      requireBusinessAccess(db, admin, "dev-pending-business"),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("denies a pending business, revoked membership, another business and suspended business", async () => {
    const consumer = await requirePrincipal(db, auth, await loginHeaders());
    await db
      .insert(membership)
      .values({
        userId: consumer.id,
        businessId: "dev-pending-business",
        role: "owner",
        active: true,
      })
      .onConflictDoNothing();
    await expect(
      requireBusinessAccess(db, consumer, "dev-pending-business"),
    ).rejects.toMatchObject({ status: 403 });
    // Test-only evidence state. No application route or dev seed can activate it.
    await db
      .update(business)
      .set({ status: "verified_active" })
      .where(eq(business.id, "dev-pending-business"));
    expect(
      (await requireBusinessAccess(db, consumer, "dev-pending-business")).role,
    ).toBe("owner");
    await expect(
      requireBusinessAccess(db, consumer, "other-business"),
    ).rejects.toMatchObject({ status: 403 });
    await db.update(membership).set({ active: false });
    await expect(
      requireBusinessAccess(db, consumer, "dev-pending-business"),
    ).rejects.toMatchObject({ status: 403 });
    await db.update(membership).set({ active: true });
    await db
      .update(business)
      .set({ status: "suspended" })
      .where(eq(business.id, "dev-pending-business"));
    await expect(
      requireBusinessAccess(db, consumer, "dev-pending-business"),
    ).rejects.toMatchObject({ status: 403 });
    await db.delete(membership);
    await db
      .update(business)
      .set({ status: "pending" })
      .where(eq(business.id, "dev-pending-business"));
  });
});
describe("authenticated writes and reversible fixtures", () => {
  it("persists a validated change and its audit record in one transaction", async () => {
    const principal = await requirePrincipal(db, auth, await loginHeaders());
    expect(
      await updateName(
        db,
        principal,
        { name: "Updated test name" },
        "test-request",
      ),
    ).toEqual({ name: "Updated test name" });
    expect(
      (await db.query.user.findFirst({ where: eq(user.id, principal.id) }))
        ?.name,
    ).toBe("Updated test name");
    const records = await db.select().from(auditLog);
    expect(records.length).toBe(1);
    expect(records[0].requestId).toBe("test-request");
    expect(records[0].actorId).toBe(principal.id);
  });
  it("rejects invalid input and privilege escalation without changing data", async () => {
    const principal = await requirePrincipal(db, auth, await loginHeaders());
    await expect(
      updateName(
        db,
        principal,
        { name: "Name", role: "admin" },
        "test-request",
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(
      (await db.query.user.findFirst({ where: eq(user.id, principal.id) }))
        ?.role,
    ).toBe("consumer");
    expect((await db.select().from(auditLog)).length).toBe(0);
  });
  it("applies the mutation limit without adding an audit or write after the cap", async () => {
    const principal = await requirePrincipal(db, auth, await loginHeaders());
    for (let attempt = 0; attempt < 10; attempt++)
      await updateName(
        db,
        principal,
        { name: `Test name ${attempt}` },
        `test-${attempt}`,
      );
    await expect(
      updateName(db, principal, { name: "Not saved" }, "test-denied"),
    ).rejects.toMatchObject({ status: 429 });
    expect((await db.select().from(auditLog)).length).toBe(10);
    expect(
      (await db.query.user.findFirst({ where: eq(user.id, principal.id) }))
        ?.name,
    ).toBe("Test name 9");
  });
  it("removes only labeled fixture data and can recreate it", async () => {
    await db
      .insert(user)
      .values({
        id: "nonfixture-test",
        email: "preserved@example.invalid",
        name: "Nonfixture test record",
        isFixture: false,
      });
    await undoDevelopmentSeed(db);
    await undoDevelopmentSeed(db);
    const remaining = await db.select().from(user);
    expect(remaining.map((row) => row.id)).toEqual(["nonfixture-test"]);
    expect((await db.select().from(business)).length).toBe(0);
    await db.delete(user).where(eq(user.id, "nonfixture-test"));
    await seedDevelopment(db);
  });
});
