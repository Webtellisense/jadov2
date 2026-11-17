import { describe, it, expect, vi } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { randomBytes } from "node:crypto";
import { readGbpConfig } from "@/server/gbp/config";
import { decrypt, digest, encrypt } from "@/server/gbp/vault";
import {
  googleFailure,
  GoogleGbpProvider,
  normalizeLocation,
  verifyGoogleIdentity,
} from "@/server/gbp/google";
import { manageScope, readMask } from "@/server/gbp/contracts";
const env = {
  APP_ORIGIN: "http://localhost:3000",
  GBP_PROVIDER_MODE: "live",
  GBP_API_ACCESS_APPROVED: "true",
  GBP_OAUTH_CLIENT_ID: "separate-gbp-client",
  GBP_OAUTH_CLIENT_SECRET: "test-secret-only",
  GBP_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
};
const config = readGbpConfig(env);
it("requires explicit API approval, live mode, separate credentials and a same-origin callback", () => {
  expect(config.available).toBe(true);
  for (const patch of [
    { GBP_API_ACCESS_APPROVED: "false" },
    { GBP_PROVIDER_MODE: "pending" },
    { GBP_OAUTH_CLIENT_SECRET: "" },
    { GBP_TOKEN_ENCRYPTION_KEY: "bad" },
    { AUTH_GOOGLE_CLIENT_ID: env.GBP_OAUTH_CLIENT_ID },
    { GBP_OAUTH_REDIRECT_URI: "https://evil.invalid/api/gbp/oauth/callback" },
  ])
    expect(readGbpConfig({ ...env, ...patch }).available).toBe(false);
  expect(readGbpConfig({}).reason).toBe("ACCESS_PENDING");
});
it("AES-GCM encrypts randomized credentials, binds context, rejects tampering and supports old keys", () => {
  const secret = "only-an-automated-test-refresh-token",
    a = encrypt(config, secret, "refresh:1:user"),
    b = encrypt(config, secret, "refresh:1:user");
  expect(a).not.toBe(b);
  expect(a).not.toContain(secret);
  expect(decrypt(config, a, "refresh:1:user")).toBe(secret);
  expect(() => decrypt(config, a, "refresh:2:user")).toThrow();
  expect(() =>
    decrypt(
      config,
      a
        .split(".")
        .map((v, i) =>
          i === 3 ? (v.startsWith("A") ? "B" : "A") + v.slice(1) : v,
        )
        .join("."),
      "refresh:1:user",
    ),
  ).toThrow();
  const rotated = readGbpConfig({
    ...env,
    GBP_TOKEN_ENCRYPTION_KEY_VERSION: "2",
    GBP_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    GBP_PREVIOUS_ENCRYPTION_KEYS: JSON.stringify({
      "1": env.GBP_TOKEN_ENCRYPTION_KEY,
    }),
  });
  expect(decrypt(rotated, a, "refresh:1:user")).toBe(secret);
  expect(encrypt(rotated, secret, "refresh:1:user").startsWith("2.")).toBe(
    true,
  );
});
it.each([
  [
    403,
    { error: { details: [{ reason: "SERVICE_DISABLED" }] } },
    "API_DISABLED",
  ],
  [403, { error: { status: "PERMISSION_DENIED" } }, "PERMISSION_DENIED"],
  [
    429,
    { error: { details: [{ reason: "QUOTA_EXCEEDED" }] } },
    "QUOTA_EXHAUSTED",
  ],
  [429, {}, "RATE_LIMITED"],
  [503, {}, "TEMPORARY_FAILURE"],
  [401, {}, "TOKEN_EXPIRED"],
  [400, { error: "invalid_grant" }, "AUTH_REVOKED"],
  [400, {}, "INVALID_REQUEST"],
])(
  "classifies Google HTTP %s without confusing failures with approval pending",
  (status, data, code) => {
    expect(googleFailure(status as number, data).code).toBe(code);
  },
);
it("uses explicit field masks, pagination and real VoM path with bounded retry", async () => {
  const fake = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ error: {} }, { status: 503 }))
    .mockResolvedValueOnce(
      Response.json({
        locations: [
          {
            name: "locations/1",
            title: "Live response",
            metadata: { placeId: "place-1", hasVoiceOfMerchant: false },
          },
        ],
        nextPageToken: "next",
      }),
    )
    .mockResolvedValueOnce(
      Response.json({ hasVoiceOfMerchant: false, verify: {} }),
    );
  const provider = new GoogleGbpProvider(config, fake);
  const page = await provider.locations("access-token", "accounts/1", "cursor");
  expect(page.nextPageToken).toBe("next");
  const target = new URL(String(fake.mock.calls[0][0]));
  expect(target.searchParams.get("readMask")).toBe(readMask);
  expect(target.searchParams.get("pageToken")).toBe("cursor");
  expect(await provider.voice("access-token", page.items[0])).toMatchObject({
    hasVoiceOfMerchant: false,
    reason: "GOOGLE_VERIFICATION_REQUIRED",
  });
  expect(String(fake.mock.calls.at(-1)![0])).toBe(
    "https://mybusinessverifications.googleapis.com/v1/locations/1/VoiceOfMerchantState",
  );
  expect(JSON.stringify(fake.mock.calls)).not.toContain(
    "places.googleapis.com",
  );
});
it("pending mode performs no network requests, and permanent permission failures are not retried", async () => {
  const fake = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ error: {} }, { status: 403 }));
  await expect(
    new GoogleGbpProvider(readGbpConfig({}), fake).accounts("token"),
  ).rejects.toMatchObject({ code: "ACCESS_PENDING" });
  expect(fake).not.toHaveBeenCalled();
  await expect(
    new GoogleGbpProvider(config, fake).accounts("token"),
  ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  expect(fake).toHaveBeenCalledTimes(1);
});
it("normalizes missing Place ID and storefront without inventing Google fields", () => {
  expect(
    normalizeLocation({
      name: "locations/5",
      title: "Mobile service",
      serviceArea: { businessType: "CUSTOMER_LOCATION_ONLY" },
    }),
  ).toMatchObject({
    placeId: null,
    address: null,
    serviceArea: true,
    phone: null,
    hasVoiceOfMerchant: null,
  });
  expect(() => normalizeLocation({ title: "No canonical ID" })).toThrow();
});
describe("caller authority evidence", () => {
  const location = "locations/1",
    account = {
      name: "accounts/1",
      accountName: "Group",
      type: "LOCATION_GROUP",
      role: "OWNER",
    };
  it.each([
    [{ account: "accounts/1", role: "OWNER" }, account, "owner"],
    [
      { account: "accounts/1", role: "OWNER" },
      { ...account, role: "MANAGER" },
      "manager",
    ],
    [{ account: "accounts/1", role: "MANAGER" }, account, "manager"],
    [
      { account: "accounts/1", role: "OWNER", pendingInvitation: true },
      account,
      "unknown",
    ],
    [{ account: "accounts/other", role: "OWNER" }, account, "unknown"],
    [{ admin: "Same display name", role: "OWNER" }, account, "unknown"],
    [
      { account: "accounts/1", role: "OWNER" },
      { ...account, type: "PERSONAL" },
      "unknown",
    ],
  ])(
    "requires accepted stable location/account delegation",
    async (admin, a, role) => {
      const fake = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ admins: [admin] }));
      expect(
        (await new GoogleGbpProvider(config, fake).role("token", a, location))
          .role,
      ).toBe(role);
    },
  );
});
it("verifies Google signed OIDC issuer/audience/nonce/expiry and rejects forged identity", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256"),
    jwk = await exportJWK(publicKey),
    keys = createLocalJWKSet({
      keys: [{ ...jwk, kid: "test-key", alg: "RS256" }],
    });
  const sign = (patch: Record<string, unknown> = {}) =>
    new SignJWT({ nonce: "nonce", ...patch })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setSubject("stable-google-subject")
      .setIssuer("https://accounts.google.com")
      .setAudience(config.clientId)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
  const token = await sign();
  expect(
    await verifyGoogleIdentity(token, config.clientId, digest("nonce"), keys),
  ).toBe("stable-google-subject");
  await expect(
    verifyGoogleIdentity(token, "other-client", digest("nonce"), keys),
  ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  await expect(
    verifyGoogleIdentity(token, config.clientId, digest("wrong"), keys),
  ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  await expect(
    verifyGoogleIdentity(
      await sign({ nonce: "changed" }),
      config.clientId,
      digest("nonce"),
      keys,
    ),
  ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  const parts = token.split(".");
  parts[1] = Buffer.from(
    JSON.stringify({ sub: "forged", nonce: "nonce" }),
  ).toString("base64url");
  await expect(
    verifyGoogleIdentity(
      parts.join("."),
      config.clientId,
      digest("nonce"),
      keys,
    ),
  ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  expect(manageScope).toContain("business.manage");
});

it("explicit revocation can run with configured OAuth after GBP access is disabled", async () => {
  const fake = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(null, { status: 200 }));
  const unavailable = readGbpConfig({ ...env, GBP_PROVIDER_MODE: "pending" });
  await new GoogleGbpProvider(unavailable, fake).revoke("test-token");
  expect(fake).toHaveBeenCalledTimes(1);
  expect(String(fake.mock.calls[0][0])).toBe(
    "https://oauth2.googleapis.com/revoke",
  );
  expect(String(fake.mock.calls[0][0])).not.toContain("test-token");
});

it("rejects non-HTTP local callbacks and invalid/expired signed Google issuers", async () => {
  expect(
    readGbpConfig({ ...env, APP_ORIGIN: "ftp://localhost" }).available,
  ).toBe(false);
  const { publicKey, privateKey } = await generateKeyPair("RS256"),
    jwk = await exportJWK(publicKey),
    keys = createLocalJWKSet({
      keys: [{ ...jwk, kid: "oidc-time-test", alg: "RS256" }],
    });
  const signed = (issuer: string, exp: number) =>
    new SignJWT({ nonce: "nonce" })
      .setProtectedHeader({ alg: "RS256", kid: "oidc-time-test" })
      .setSubject("subject")
      .setIssuer(issuer)
      .setAudience(config.clientId)
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(privateKey);
  await expect(
    verifyGoogleIdentity(
      await signed("https://evil.invalid", Math.floor(Date.now() / 1000) + 300),
      config.clientId,
      digest("nonce"),
      keys,
    ),
  ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  await expect(
    verifyGoogleIdentity(
      await signed(
        "https://accounts.google.com",
        Math.floor(Date.now() / 1000) - 300,
      ),
      config.clientId,
      digest("nonce"),
      keys,
    ),
  ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
});
