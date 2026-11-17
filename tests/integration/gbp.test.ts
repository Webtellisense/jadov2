import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { connectDatabase } from "@/db/connection";
import {
  business,
  businessOnboarding,
  gbpConnection,
  gbpOAuthState,
  membership,
  user,
  verificationAudit,
  mutationLimit,
} from "@/db/schema";
import {
  createBusinessDraft,
  readBusinessDraft,
  saveBusinessDraft,
} from "@/server/business-drafts";
import { GbpService, type Actor } from "@/server/gbp/service";
import { readGbpConfig } from "@/server/gbp/config";
import { decrypt } from "@/server/gbp/vault";
import {
  GbpFailure,
  manageScope,
  type GbpProvider,
  type GbpLocation,
  type RoleEvidence,
} from "@/server/gbp/contracts";
import { seedPrototype, undoPrototype } from "@/db/prototype-data";
const { db, pool } = connectDatabase(process.env.DATABASE_URL!);
const config = readGbpConfig({
  APP_ORIGIN: "http://localhost:3000",
  GBP_PROVIDER_MODE: "live",
  GBP_API_ACCESS_APPROVED: "true",
  GBP_OAUTH_CLIENT_ID: "gbp-test",
  GBP_OAUTH_CLIENT_SECRET: "only-in-tests",
  GBP_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
});
// Isolated automated provider double. Runtime has no registry, mock mode or environment switch for it.
function providerDouble() {
  const location: GbpLocation = {
    name: `locations/${randomUUID()}`,
    title: "Genuine provider test boundary",
    category: "Solar",
    address: null,
    serviceArea: true,
    phone: null,
    website: null,
    hours: null,
    placeId: null,
    mapsUri: null,
    hasVoiceOfMerchant: true,
  };
  return {
    record: location,
    exchange: vi.fn<GbpProvider["exchange"]>().mockResolvedValue({
      subject: randomUUID(),
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresAt: new Date(Date.now() + 3600000),
      scopes: [manageScope],
    }),
    refresh: vi.fn<GbpProvider["refresh"]>().mockResolvedValue({
      accessToken: "test-access-refreshed",
      expiresAt: new Date(Date.now() + 3600000),
      scopes: [manageScope],
    }),
    revoke: vi.fn<GbpProvider["revoke"]>().mockResolvedValue(),
    accounts: vi.fn<GbpProvider["accounts"]>().mockResolvedValue({
      items: [
        {
          name: "accounts/1",
          accountName: "Group",
          type: "LOCATION_GROUP",
          role: "OWNER",
        },
      ],
      nextPageToken: "next-account",
    }),
    account: vi.fn<GbpProvider["account"]>().mockResolvedValue({
      name: "accounts/1",
      accountName: "Group",
      type: "LOCATION_GROUP",
      role: "OWNER",
    }),
    locations: vi
      .fn<GbpProvider["locations"]>()
      .mockResolvedValue({ items: [location], nextPageToken: "next-location" }),
    location: vi.fn<GbpProvider["location"]>().mockResolvedValue(location),
    voice: vi
      .fn<GbpProvider["voice"]>()
      .mockResolvedValue({ hasVoiceOfMerchant: true, reason: null }),
    role: vi.fn<GbpProvider["role"]>().mockResolvedValue({
      role: "owner",
      source: "location_account_chain",
    } satisfies RoleEvidence),
  };
}
let actor: Actor,
  id: string,
  provider: ReturnType<typeof providerDouble>,
  service: GbpService;
beforeAll(async () => {
  await seedPrototype(db);
});
beforeEach(async () => {
  await db.delete(mutationLimit);
  const [principal] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: "Applicant",
      email: `${randomUUID()}@example.invalid`,
      emailVerified: true,
    })
    .returning();
  actor = { principal, sessionId: randomUUID() };
  id = (
    await createBusinessDraft(
      db,
      principal,
      {
        name: "Private Energy",
        description: "Representative Jado description",
        serviceArea: "Uyo",
        contactEmail: "contact@example.invalid",
      },
      "test-create",
    )
  ).id;
  provider = providerDouble();
  service = new GbpService(db, config, provider);
});
afterAll(async () => {
  await pool.end();
});
async function connect(instance = service, who = actor, businessId = id) {
  const start = await instance.start(who, businessId, "start");
  if (start.pending) throw new Error("Unexpected pending test");
  await instance.callback(
    who,
    start.state,
    start.cookie,
    "one-use-code",
    false,
    "callback",
  );
  return start;
}
async function select() {
  return service.select(
    actor,
    id,
    "accounts/1",
    provider.record.name,
    undefined,
    "select",
  );
}
async function row() {
  return (await db.select().from(business).where(eq(business.id, id)))[0];
}
it("pending provider preserves private drafts and makes no Google calls", async () => {
  const pending = new GbpService(db, readGbpConfig({}), provider);
  expect(await pending.start(actor, id, "pending")).toMatchObject({
    pending: true,
    reason: "ACCESS_PENDING",
  });
  expect(await pending.status(actor, id)).toMatchObject({
    available: false,
    connection: "not_connected",
    state: "pending_gbp_approval",
  });
  expect(provider.exchange).not.toHaveBeenCalled();
  expect(
    await db
      .select()
      .from(gbpOAuthState)
      .where(eq(gbpOAuthState.businessId, id)),
  ).toHaveLength(0);
  expect((await readBusinessDraft(db, actor.principal, id)).details.name).toBe(
    "Private Energy",
  );
});
it("binds consent to user/session/draft/cookie, consumes once and encrypts all credentials", async () => {
  const start = await service.start(actor, id, "start");
  if (start.pending) throw new Error();
  const url = new URL(start.url);
  expect(url.searchParams.get("scope")).toBe(`openid ${manageScope}`);
  expect(url.searchParams.get("access_type")).toBe("offline");
  expect(url.searchParams.get("prompt")).toContain("select_account");
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
  const pending = (
    await db
      .select()
      .from(gbpOAuthState)
      .where(eq(gbpOAuthState.businessId, id))
  )[0];
  expect(pending.id).not.toBe(start.state);
  expect(pending.verifierCipher).not.toContain(
    url.searchParams.get("code_challenge")!,
  );
  for (const [who, cookie] of [
    [{ ...actor, sessionId: "other-session" }, start.cookie],
    [actor, "wrong-cookie"],
    [actor, undefined],
  ] as const)
    await expect(
      service.callback(who, start.state, cookie, "code", false, "bad"),
    ).rejects.toMatchObject({ code: "OAUTH_STATE_INVALID" });
  expect(provider.exchange).not.toHaveBeenCalled();
  await service.callback(
    actor,
    start.state,
    start.cookie,
    "code",
    false,
    "good",
  );
  await expect(
    service.callback(actor, start.state, start.cookie, "code", false, "replay"),
  ).rejects.toMatchObject({ code: "OAUTH_STATE_INVALID" });
  const conn = (
    await db
      .select()
      .from(gbpConnection)
      .where(eq(gbpConnection.userId, actor.principal.id))
  )[0];
  expect(JSON.stringify(conn)).not.toContain("test-access-token");
  expect(JSON.stringify(conn)).not.toContain("test-refresh-token");
  expect(
    decrypt(
      config,
      conn.refreshCipher!,
      `refresh:${conn.id}:${actor.principal.id}`,
    ),
  ).toBe("test-refresh-token");
  expect(
    (
      await db.query.gbpOAuthState.findFirst({
        where: eq(gbpOAuthState.id, pending.id),
      })
    )?.verifierCipher,
  ).toBe("");
});
it("rejects wrong users and expired state; cancellation never exchanges a code", async () => {
  const start = await service.start(actor, id, "start");
  if (start.pending) throw new Error();
  const [other] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: "Other",
      email: `${randomUUID()}@example.invalid`,
      emailVerified: true,
    })
    .returning();
  await expect(
    service.callback(
      { principal: other, sessionId: actor.sessionId },
      start.state,
      start.cookie,
      "code",
      false,
      "other",
    ),
  ).rejects.toMatchObject({ code: "OAUTH_STATE_INVALID" });
  await service.callback(
    actor,
    start.state,
    start.cookie,
    undefined,
    true,
    "cancel",
  );
  expect(provider.exchange).not.toHaveBeenCalled();
  const expired = await service.start(actor, id, "expired");
  if (expired.pending) throw new Error();
  await db
    .update(gbpOAuthState)
    .set({ expiresAt: new Date(0) })
    .where(eq(gbpOAuthState.businessId, id));
  await expect(
    service.callback(
      actor,
      expired.state,
      expired.cookie,
      "code",
      false,
      "expired",
    ),
  ).rejects.toMatchObject({ code: "OAUTH_STATE_INVALID" });
});
it("reconnects the same Google subject without dropping refresh credentials and keeps changed subjects distinct", async () => {
  await connect();
  const before = (
    await db
      .select()
      .from(gbpConnection)
      .where(eq(gbpConnection.userId, actor.principal.id))
  )[0];
  provider.exchange.mockResolvedValue({
    subject: before.subject,
    accessToken: "replacement-access",
    expiresAt: new Date(Date.now() + 3600000),
    scopes: [manageScope],
  });
  await connect();
  const same = (
    await db.select().from(gbpConnection).where(eq(gbpConnection.id, before.id))
  )[0];
  expect(same.refreshCipher).toBe(before.refreshCipher);
  expect(same.version).toBe(2);
  provider.exchange.mockResolvedValue({
    subject: "different-google-account",
    accessToken: "another-access",
    refreshToken: "another-refresh",
    expiresAt: new Date(Date.now() + 3600000),
    scopes: [manageScope],
  });
  await connect();
  expect(
    await db
      .select()
      .from(gbpConnection)
      .where(eq(gbpConnection.userId, actor.principal.id)),
  ).toHaveLength(2);
});
it("uses pagination contracts without an arbitrary per-account business cap", async () => {
  await connect();
  expect(
    (await service.accounts(actor, id, "page2", "accounts")).nextPageToken,
  ).toBe("next-account");
  expect(provider.accounts).toHaveBeenCalledWith("test-access-token", "page2");
  expect(
    (await service.locations(actor, id, "accounts/1", "page3", "locations"))
      .nextPageToken,
  ).toBe("next-location");
  expect(provider.locations).toHaveBeenCalledWith(
    "test-access-token",
    "accounts/1",
    "page3",
  );
});
it("qualifies a genuinely authorized canonical location without Place ID, but remains private", async () => {
  await connect();
  expect(await select()).toEqual({ state: "verified_eligible", reason: null });
  const saved = await row();
  expect(saved.gbpLocationId).toBe(provider.record.name);
  expect(saved.googlePlaceId).toBeNull();
  expect(saved.lifecycleState).not.toBe("published");
  expect(saved.proofValidUntil).toBeInstanceOf(Date);
  expect(
    (
      await db.select().from(membership).where(eq(membership.businessId, id))
    )[0],
  ).toMatchObject({
    role: "owner",
    active: true,
    grantSource: "gbp_location_account_chain",
  });
  const draft = await readBusinessDraft(db, actor.principal, id);
  expect(draft.identityLocked).toBe(true);
  expect(draft.details.name).toBe("Private Energy");
  expect(
    JSON.stringify(
      await db
        .select()
        .from(businessOnboarding)
        .where(eq(businessOnboarding.businessId, id)),
    ),
  ).not.toContain("Genuine provider test boundary");
});
it.each(["unknown", "manager"] as const)(
  "management alone does not grant OWNER (%s evidence)",
  async (role) => {
    provider.role.mockResolvedValue({
      role,
      source: role === "unknown" ? "unresolved" : "location_account_chain",
    });
    await connect();
    await select();
    const members = await db
      .select()
      .from(membership)
      .where(eq(membership.businessId, id));
    expect(members.some((m) => m.role === "owner")).toBe(false);
    if (role === "unknown") {
      expect(members).toHaveLength(0);
      expect((await row()).reasonCode).toBe("ROLE_AUTHORITY_UNRESOLVED");
    } else expect(members[0].role).toBe("manager");
  },
);
it("Voice of Merchant failure never qualifies a business and keeps resumable details", async () => {
  provider.voice.mockResolvedValue({
    hasVoiceOfMerchant: false,
    reason: "GOOGLE_VERIFICATION_REQUIRED",
  });
  await connect();
  expect(await select()).toMatchObject({ state: "gbp_unverified" });
  expect((await row()).proofValidUntil).toBeNull();
  expect(
    (await readBusinessDraft(db, actor.principal, id)).details.description,
  ).toBeTruthy();
});
it("requires a complete Jado profile and rejects client canonical identity edits", async () => {
  const draft = await readBusinessDraft(db, actor.principal, id);
  await saveBusinessDraft(
    db,
    actor.principal,
    id,
    { version: draft.version, details: { ...draft.details, description: "" } },
    "incomplete",
  );
  await connect();
  expect(await select()).toMatchObject({
    state: "draft",
    reason: "PROFILE_INCOMPLETE",
  });
  const current = await readBusinessDraft(db, actor.principal, id);
  await expect(
    saveBusinessDraft(
      db,
      actor.principal,
      id,
      {
        version: current.version,
        details: { ...current.details, name: "Overwrite Google" },
      },
      "bad",
    ),
  ).rejects.toMatchObject({ code: "GOOGLE_IDENTITY_LOCKED" });
  await saveBusinessDraft(
    db,
    actor.principal,
    id,
    {
      version: current.version,
      details: { ...current.details, description: "New private About" },
    },
    "resume",
  );
  expect(
    (await readBusinessDraft(db, actor.principal, id)).details.description,
  ).toBe("New private About");
});
it("blocks duplicate canonical identities transactionally, including missing Place ID and concurrency", async () => {
  await connect();
  const second = (
    await createBusinessDraft(
      db,
      actor.principal,
      {
        name: "Second company",
        description: "About",
        serviceArea: "Uyo",
        contactEmail: "contact@example.invalid",
      },
      "second",
    )
  ).id;
  await connect(service, actor, second);
  const results = await Promise.allSettled([
    service.select(
      actor,
      id,
      "accounts/1",
      provider.record.name,
      undefined,
      "first",
    ),
    service.select(
      actor,
      second,
      "accounts/1",
      provider.record.name,
      undefined,
      "second",
    ),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.find((r) => r.status === "rejected")).toMatchObject({
    reason: { code: "DUPLICATE_CLAIM" },
  });
  expect(
    await db
      .select()
      .from(business)
      .where(eq(business.gbpLocationId, provider.record.name)),
  ).toHaveLength(1);
});
it("also protects a Google Place ID shared by conflicting GBP locations", async () => {
  const existingId = randomUUID();
  await db.insert(business).values({
    id: existingId,
    slug: existingId,
    googlePlaceId: "conflicting-place",
  });
  provider.location.mockResolvedValue({
    ...provider.record,
    placeId: "conflicting-place",
  });
  await connect();
  await expect(select()).rejects.toMatchObject({ code: "DUPLICATE_CLAIM" });
  expect((await row()).gbpLocationId).toBeNull();
});
it.each([
  "TEMPORARY_FAILURE",
  "PERMISSION_DENIED",
  "RATE_LIMITED",
  "QUOTA_EXHAUSTED",
] as const)("does not revoke a successful authority for %s", async (code) => {
  await connect();
  await select();
  const before = await row();
  provider.location.mockRejectedValue(
    new GbpFailure(code, code === "TEMPORARY_FAILURE"),
  );
  await expect(service.recheck(actor, id, "recheck")).rejects.toMatchObject({
    code,
  });
  const after = await row();
  expect(after.lifecycleState).toBe(before.lifecycleState);
  expect(after.proofValidUntil).toEqual(before.proofValidUntil);
});
it("serializes expired-token refresh and preserves an omitted refresh token", async () => {
  await connect();
  await db
    .update(gbpConnection)
    .set({ expiresAt: new Date(0) })
    .where(eq(gbpConnection.userId, actor.principal.id));
  await Promise.all([
    service.accounts(actor, id, undefined, "a"),
    service.accounts(actor, id, undefined, "b"),
  ]);
  expect(provider.refresh).toHaveBeenCalledTimes(1);
  const conn = (
    await db
      .select()
      .from(gbpConnection)
      .where(eq(gbpConnection.userId, actor.principal.id))
  )[0];
  expect(
    decrypt(config, conn.refreshCipher!, `refresh:${conn.id}:${conn.userId}`),
  ).toBe("test-refresh-token");
});
it("confirmed revoked authorization triggers reverification while preserving records", async () => {
  await connect();
  await select();
  await db
    .update(gbpConnection)
    .set({ expiresAt: new Date(0) })
    .where(eq(gbpConnection.userId, actor.principal.id));
  provider.refresh.mockRejectedValue(new GbpFailure("AUTH_REVOKED"));
  await expect(
    service.accounts(actor, id, undefined, "revoked"),
  ).rejects.toMatchObject({ code: "AUTH_REVOKED" });
  expect(await row()).toMatchObject({
    lifecycleState: "reverification_required",
    reasonCode: "GOOGLE_AUTHORIZATION_REVOKED",
    proofValidUntil: null,
  });
  expect((await readBusinessDraft(db, actor.principal, id)).details.name).toBe(
    "Private Energy",
  );
});
it("MANAGER cannot disconnect the primary authority, while OWNER revocation is local-first with retry", async () => {
  await connect();
  await select();
  await db
    .update(membership)
    .set({ role: "manager" })
    .where(eq(membership.businessId, id));
  await expect(service.disconnect(actor, id, "manager")).rejects.toMatchObject({
    code: "OWNER_AUTHORITY_REQUIRED",
  });
  expect(provider.revoke).not.toHaveBeenCalled();
  await db
    .update(membership)
    .set({ role: "owner" })
    .where(eq(membership.businessId, id));
  provider.revoke.mockRejectedValueOnce(
    new GbpFailure("TEMPORARY_FAILURE", true),
  );
  expect(await service.disconnect(actor, id, "owner")).toEqual({
    connection: "revocation_pending",
  });
  expect((await row()).lifecycleState).toBe("reverification_required");
  expect(await service.disconnect(actor, id, "retry")).toEqual({
    connection: "revoked",
  });
  const conn = (
    await db
      .select()
      .from(gbpConnection)
      .where(eq(gbpConnection.userId, actor.principal.id))
  )[0];
  expect(conn.accessCipher).toBeNull();
  expect(conn.refreshCipher).toBeNull();
});
it("discards verification obtained before a concurrent disconnect", async () => {
  await connect();
  await select();
  provider.voice.mockImplementationOnce(async () => {
    await service.disconnect(actor, id, "parallel-disconnect");
    return { hasVoiceOfMerchant: true, reason: null };
  });
  await expect(service.recheck(actor, id, "stale")).rejects.toMatchObject({
    code: "CONNECTION_CHANGED",
  });
  expect((await row()).lifecycleState).toBe("reverification_required");
});
it("denies fixture claims, unrelated users, unverified accounts and abuse; audit is append-only", async () => {
  await expect(
    service.start(actor, "demo-amber-roof", "fixture"),
  ).rejects.toMatchObject({ status: 404 });
  const [other] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: "Other",
      email: `${randomUUID()}@example.invalid`,
      emailVerified: true,
    })
    .returning();
  await expect(
    service.start({ principal: other, sessionId: "other" }, id, "other"),
  ).rejects.toMatchObject({ status: 404 });
  await db
    .update(user)
    .set({ emailVerified: false })
    .where(eq(user.id, actor.principal.id));
  await expect(service.start(actor, id, "unverified")).rejects.toMatchObject({
    code: "EMAIL_VERIFICATION_REQUIRED",
  });
  await db
    .update(user)
    .set({ emailVerified: true })
    .where(eq(user.id, actor.principal.id));
  for (let i = 0; i < 6; i++) await service.start(actor, id, "limit");
  await expect(service.start(actor, id, "limited")).rejects.toMatchObject({
    status: 429,
  });
  await expect(
    db.execute(
      sql`delete from verification_audit_logs where business_id=${id}`,
    ),
  ).rejects.toThrow();
});
it("fixture undo/reseed cannot mutate real connections, canonical identity or audit history", async () => {
  await connect();
  await select();
  const before = await row();
  const logs = await db
    .select()
    .from(verificationAudit)
    .where(eq(verificationAudit.businessId, id));
  await undoPrototype(db);
  await seedPrototype(db);
  await seedPrototype(db);
  expect(await row()).toEqual(before);
  expect(
    await db
      .select()
      .from(verificationAudit)
      .where(eq(verificationAudit.businessId, id)),
  ).toHaveLength(logs.length);
  expect(
    (await db.execute(sql`select count(*)::int as n from development_business`))
      .rows[0].n,
  ).toBe(10);
  expect(
    (await db.execute(sql`select count(*)::int as n from development_post`))
      .rows[0].n,
  ).toBe(20);
});

it("confirmed loss of owner-level authority requires reverification without silently downgrading ownership", async () => {
  await connect();
  await select();
  provider.role.mockResolvedValue({
    role: "manager",
    source: "location_account_chain",
  });
  expect(await service.recheck(actor, id, "authority-lost")).toMatchObject({
    state: "reverification_required",
    reason: "OWNER_AUTHORITY_LOST",
  });
  expect(
    (await db.select().from(membership).where(eq(membership.businessId, id)))[0]
      .role,
  ).toBe("owner");
});
it("Google VoM loss after a successful proof requires reverification immediately", async () => {
  await connect();
  await select();
  provider.voice.mockResolvedValue({
    hasVoiceOfMerchant: false,
    reason: "GOOGLE_OWNERSHIP_CONFLICT",
  });
  expect(await service.recheck(actor, id, "vom-lost")).toMatchObject({
    state: "reverification_required",
    reason: "GOOGLE_OWNERSHIP_CONFLICT",
  });
  expect((await row()).proofValidUntil).toBeNull();
});
it("rejects locations outside the fresh manageable page and prevents canonical retargeting", async () => {
  await connect();
  provider.locations.mockResolvedValueOnce({ items: [] });
  await expect(select()).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  expect(provider.voice).not.toHaveBeenCalled();
  await select();
  const different = { ...provider.record, name: "locations/different" };
  provider.locations.mockResolvedValueOnce({ items: [different] });
  provider.location.mockResolvedValueOnce(different);
  await expect(
    service.select(
      actor,
      id,
      "accounts/1",
      different.name,
      undefined,
      "retarget",
    ),
  ).rejects.toMatchObject({ code: "CANONICAL_IDENTITY_LOCKED" });
  expect((await row()).gbpLocationId).toBe(provider.record.name);
});
it("disconnect invalidates every business bound to that authority and preserves all drafts", async () => {
  await connect();
  await select();
  const first = await row();
  const second = (
    await createBusinessDraft(
      db,
      actor.principal,
      {
        name: "Second authorized business",
        description: "About",
        serviceArea: "Uyo",
        contactEmail: "c@example.invalid",
      },
      "new",
    )
  ).id;
  await connect(service, actor, second);
  const secondLocation = {
    ...provider.record,
    name: `locations/${randomUUID()}`,
  };
  provider.locations.mockResolvedValueOnce({ items: [secondLocation] });
  provider.location.mockResolvedValueOnce(secondLocation);
  await service.select(
    actor,
    second,
    "accounts/1",
    secondLocation.name,
    undefined,
    "second",
  );
  expect(await service.disconnect(actor, id, "all")).toEqual({
    connection: "revoked",
  });
  for (const businessId of [first.id, second])
    expect(
      (
        await db.query.business.findFirst({
          where: eq(business.id, businessId),
        })
      )?.lifecycleState,
    ).toBe("reverification_required");
  expect(
    (await readBusinessDraft(db, actor.principal, second)).details.name,
  ).toBe("Second authorized business");
});
it("removing required About content cannot leave a draft publication-eligible", async () => {
  await connect();
  await select();
  const current = await readBusinessDraft(db, actor.principal, id);
  await saveBusinessDraft(
    db,
    actor.principal,
    id,
    {
      version: current.version,
      details: { ...current.details, description: "" },
    },
    "incomplete",
  );
  expect((await row()).lifecycleState).toBe("draft");
  expect((await row()).reasonCode).toBe("PROFILE_RECHECK_REQUIRED");
});

it("an optional role lookup 403 cannot erase a prior successful proof", async () => {
  await connect();
  await select();
  const before = await row();
  provider.role.mockRejectedValue(new GbpFailure("PERMISSION_DENIED"));
  await expect(
    service.recheck(actor, id, "role-unavailable"),
  ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  expect((await row()).lifecycleState).toBe(before.lifecycleState);
  expect((await row()).proofValidUntil).toEqual(before.proofValidUntil);
});
it("a manager without their own Google grant cannot enumerate another member's accounts", async () => {
  await connect();
  await select();
  const [other] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: "Authorized manager",
      email: `${randomUUID()}@example.invalid`,
      emailVerified: true,
    })
    .returning();
  await db
    .insert(membership)
    .values({
      businessId: id,
      userId: other.id,
      role: "manager",
      active: true,
      grantSource: "owner_invitation",
    });
  await expect(
    service.accounts(
      { principal: other, sessionId: "manager-session" },
      id,
      undefined,
      "private-accounts",
    ),
  ).rejects.toMatchObject({ code: "GBP_CONNECTION_REQUIRED" });
  expect(provider.accounts).not.toHaveBeenCalled();
});
it("reconnect cannot resurrect a refresh grant already known to be revoked when Google omits a replacement", async () => {
  await connect();
  const conn = (
    await db
      .select()
      .from(gbpConnection)
      .where(eq(gbpConnection.userId, actor.principal.id))
  )[0];
  await db
    .update(gbpConnection)
    .set({ status: "reauthorization_required" })
    .where(eq(gbpConnection.id, conn.id));
  provider.exchange.mockResolvedValue({
    subject: conn.subject,
    accessToken: "new-short-lived-access",
    expiresAt: new Date(Date.now() + 3600000),
    scopes: [manageScope],
  });
  await expect(connect()).rejects.toMatchObject({ code: "AUTH_REVOKED" });
  expect(
    (
      await db.query.gbpConnection.findFirst({
        where: eq(gbpConnection.id, conn.id),
      })
    )?.status,
  ).toBe("reauthorization_required");
});
