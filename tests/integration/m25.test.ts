import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { connectDatabase } from "@/db/connection";
import {
  user,
  business,
  membership,
  verificationAudit,
  verification,
  rateLimit,
} from "@/db/schema";
import { createAuth } from "@/server/auth";
import { readConfig } from "@/lib/config";
import type { Principal } from "@/server/authorization";
import {
  createBusinessDraft,
  readBusinessDraft,
  saveBusinessDraft,
  listBusinessDrafts,
} from "@/server/business-drafts";
import { seedPrototype, undoPrototype } from "@/db/prototype-data";
import { readPrototype } from "@/server/prototype-repository";
import { parseFilters } from "@/lib/discovery";
const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
const config = readConfig();
const deliveries: { to: string; text: string }[] = [];
const auth = createAuth(
  db,
  config,
  false,
  {
    available: true,
    async send(message) {
      deliveries.push(message);
    },
  },
  {},
);
const email = "applicant@example.invalid",
  password = "A-valid-test-password-1289";
let applicant: Principal;
let id: string;
async function post(path: string, body: unknown, instance = auth) {
  return instance.handler(
    new Request(`${config.APP_ORIGIN}/api/auth${path}`, {
      method: "POST",
      headers: {
        origin: config.APP_ORIGIN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
}
beforeAll(async () => {
  await seedPrototype(db);
});
afterAll(async () => {
  await pool.end();
});
it("registers with a real Better Auth credential, keeps unverified accounts out and hashes OTPs", async () => {
  expect(
    (await post("/sign-up/email", { email, password, name: "Applicant" }))
      .status,
  ).toBe(200);
  const row = await db.query.user.findFirst({ where: eq(user.email, email) });
  expect(row?.emailVerified).toBe(false);
  applicant = row!;
  await expect(
    createBusinessDraft(db, applicant, { name: "Private company" }, "test"),
  ).rejects.toMatchObject({ code: "EMAIL_VERIFICATION_REQUIRED" });
  const code = deliveries.at(-1)!.text.match(/\b\d{6}\b/)![0];
  const stored = await db.select().from(verification);
  expect(stored.every((row) => !row.value.includes(code))).toBe(true);
  expect(
    (
      await post("/email-otp/verify-email", {
        email,
        otp: "000000" === code ? "111111" : "000000",
      })
    ).status,
  ).not.toBe(200);
  expect(
    (await post("/email-otp/verify-email", { email, otp: code })).status,
  ).toBe(200);
  expect(
    (await post("/email-otp/verify-email", { email, otp: code })).status,
  ).not.toBe(200);
  expect((await post("/sign-in/email", { email, password })).status).toBe(200);
});
it("creates and resumes a private draft without owner membership, Place ID or public leakage", async () => {
  id = (
    await createBusinessDraft(
      db,
      applicant,
      {
        name: "Applicant Energy",
        serviceArea: "Uyo",
        description: "Private business notes",
      },
      "create",
    )
  ).id;
  const row = await readBusinessDraft(db, applicant, id);
  expect(row.state).toBe("pending_gbp_approval");
  expect(row.version).toBe(1);
  expect(
    await db.select().from(membership).where(eq(membership.businessId, id)),
  ).toHaveLength(0);
  const [real] = await db.select().from(business).where(eq(business.id, id));
  expect(real.googlePlaceId).toBeNull();
  expect(real.gbpLocationId).toBeNull();
  expect(
    (await readPrototype(db, parseFilters({ area: "Uyo" }))).businesses,
  ).toHaveLength(10);
  expect(
    (
      await readPrototype(
        db,
        parseFilters({ area: "Uyo", q: "Applicant Energy" }),
      )
    ).businesses,
  ).toHaveLength(0);
  await saveBusinessDraft(
    db,
    applicant,
    id,
    {
      version: 1,
      details: { ...row.details, description: "Saved after refresh" },
    },
    "save",
  );
  expect((await readBusinessDraft(db, applicant, id)).details.description).toBe(
    "Saved after refresh",
  );
  await expect(
    saveBusinessDraft(
      db,
      applicant,
      id,
      { version: 1, details: row.details },
      "stale",
    ),
  ).rejects.toMatchObject({ code: "VERSION_CONFLICT" });
});
it("denies other users, revoked membership, fixtures, unverified and suspended accounts", async () => {
  const [other] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      email: "unrelated@example.invalid",
      name: "Other",
      emailVerified: true,
    })
    .returning();
  await expect(readBusinessDraft(db, other, id)).rejects.toMatchObject({
    status: 404,
  });
  await expect(
    saveBusinessDraft(
      db,
      other,
      id,
      { version: 2, details: { name: "Intruder" } },
      "deny",
    ),
  ).rejects.toMatchObject({ status: 404 });
  await db.insert(membership).values({
    userId: other.id,
    businessId: id,
    role: "manager",
    active: true,
  });
  expect(await listBusinessDrafts(db, other)).toHaveLength(1);
  await db
    .update(membership)
    .set({ active: false })
    .where(eq(membership.userId, other.id));
  await expect(readBusinessDraft(db, other, id)).rejects.toMatchObject({
    status: 404,
  });
  await db
    .update(user)
    .set({ state: "suspended" })
    .where(eq(user.id, applicant.id));
  await expect(
    createBusinessDraft(db, applicant, { name: "Suspended" }, "deny"),
  ).rejects.toMatchObject({ code: "ACCOUNT_UNAVAILABLE" });
  await db
    .update(user)
    .set({ state: "active", emailVerified: false })
    .where(eq(user.id, applicant.id));
  await expect(readBusinessDraft(db, applicant, id)).rejects.toMatchObject({
    code: "EMAIL_VERIFICATION_REQUIRED",
  });
  await db
    .update(user)
    .set({ emailVerified: true, isFixture: true })
    .where(eq(user.id, applicant.id));
  await expect(
    createBusinessDraft(db, applicant, { name: "Fixture" }, "deny"),
  ).rejects.toMatchObject({ code: "REAL_ACCOUNT_REQUIRED" });
  await db
    .update(user)
    .set({ isFixture: false })
    .where(eq(user.id, applicant.id));
  await expect(
    readBusinessDraft(db, applicant, "demo-amber-roof"),
  ).rejects.toMatchObject({ status: 404 });
});
it("records transactional lifecycle history and rejects audit modification", async () => {
  const events = await db
    .select()
    .from(verificationAudit)
    .where(eq(verificationAudit.businessId, id));
  expect(events.map((e) => e.event)).toContain("business.state_changed");
  await expect(
    db
      .update(verificationAudit)
      .set({ event: "forged" })
      .where(eq(verificationAudit.businessId, id)),
  ).rejects.toThrow();
  await expect(
    db.delete(verificationAudit).where(eq(verificationAudit.businessId, id)),
  ).rejects.toThrow();
});
it("preserves real drafts through namespaced fixture undo and reseed", async () => {
  await undoPrototype(db);
  await seedPrototype(db);
  await seedPrototype(db);
  expect((await readBusinessDraft(db, applicant, id)).details.name).toBe(
    "Applicant Energy",
  );
  expect(
    (await readPrototype(db, parseFilters({ area: "Uyo" }))).businesses,
  ).toHaveLength(10);
});
it("runs genuine password recovery, consumes the token and rejects the old password", async () => {
  await db.delete(rateLimit);
  expect(
    (
      await post("/request-password-reset", {
        email,
        redirectTo: "/reset-password",
      })
    ).status,
  ).toBe(200);
  const link = deliveries.at(-1)!.text.split("Reset your password: ")[1];
  const callback = await auth.handler(new Request(link));
  expect(callback.status).toBe(302);
  const token = new URL(
    callback.headers.get("location")!,
    config.APP_ORIGIN,
  ).searchParams.get("token");
  expect(token).toBeTruthy();
  expect(
    (await post("/reset-password", { token, newPassword: password + "-new" }))
      .status,
  ).toBe(200);
  expect(
    (await post("/reset-password", { token, newPassword: password })).status,
  ).not.toBe(200);
  expect((await post("/sign-in/email", { email, password })).status).not.toBe(
    200,
  );
  expect(
    (await post("/sign-in/email", { email, password: password + "-new" }))
      .status,
  ).toBe(200);
});
it("failed delivery never marks an account verified", async () => {
  const failed = createAuth(
    db,
    config,
    false,
    {
      available: true,
      async send() {
        throw new Error("test delivery unavailable");
      },
    },
    {},
  );
  const response = await post(
    "/sign-up/email",
    { email: "delivery-failure@example.invalid", password, name: "Failure" },
    failed,
  );
  expect(response.status).toBeGreaterThanOrEqual(400);
  const row = await db.query.user.findFirst({
    where: eq(user.email, "delivery-failure@example.invalid"),
  });
  expect(row?.emailVerified).not.toBe(true);
});
it("enforces canonical uniqueness while allowing several missing Place IDs", async () => {
  await createBusinessDraft(
    db,
    applicant,
    { name: "Another independent business" },
    "multi",
  );
  await db
    .update(business)
    .set({ gbpLocationId: "test-location-identity" })
    .where(eq(business.id, id));
  await expect(
    db.insert(business).values({
      id: randomUUID(),
      slug: randomUUID(),
      gbpLocationId: "test-location-identity",
    }),
  ).rejects.toThrow();
  await expect(
    db.execute(
      sql`update business set lifecycle_state='client_forged' where id=${id}`,
    ),
  ).rejects.toThrow();
});

it("Google identity starts separately with minimal scopes and rejects an unsolicited callback", async () => {
  const google = createAuth(
    db,
    config,
    false,
    {
      available: false,
      async send() {
        throw new Error("disabled");
      },
    },
    {
      AUTH_GOOGLE_ENABLED: "true",
      AUTH_GOOGLE_CLIENT_ID: "test-client",
      AUTH_GOOGLE_CLIENT_SECRET: "test-secret",
    },
  );
  const response = await post(
    "/sign-in/social",
    { provider: "google", callbackURL: "/my-business" },
    google,
  );
  expect(response.status).toBe(200);
  const target = new URL((await response.json()).url);
  expect(target.hostname).toBe("accounts.google.com");
  expect(target.searchParams.get("scope")).not.toContain("business.manage");
  expect(target.searchParams.get("state")).toBeTruthy();
  const network = vi.spyOn(globalThis, "fetch");
  try {
    const callback = await google.handler(
      new Request(
        `${config.APP_ORIGIN}/api/auth/callback/google?state=unsolicited&code=invalid`,
      ),
    );
    expect(callback.status).not.toBe(200);
    expect(network).not.toHaveBeenCalled();
  } finally {
    network.mockRestore();
  }
});
