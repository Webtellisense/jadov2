import { afterEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import {
  assertActive,
  assertRole,
  type Principal,
} from "@/server/authorization";
import { assertLocalDevelopmentDatabase } from "@/db/dev-guard";
import { readConfig } from "@/lib/config";
import { safeReturnPath } from "@/lib/navigation";
import { createProviders } from "@/server/integrations";
import { nameInput } from "@/server/account";
import { assertSameOrigin, readJson, route } from "@/server/http";

const principal: Principal = {
  id: "test-user",
  name: "[TEST] User",
  email: "user@example.invalid",
  role: "consumer",
  state: "active",
  isFixture: false,
};
afterEach(() => vi.restoreAllMocks());
describe("authorization", () => {
  it("accepts an active account", () =>
    expect(() => assertActive(principal)).not.toThrow());
  it("requires authentication", () =>
    expect(() => assertActive(null)).toThrow("Sign in"));
  it.each(["suspended", "deleted"] as const)("denies %s accounts", (state) =>
    expect(() => assertActive({ ...principal, state })).toThrow("unavailable"),
  );
  it("rejects a fixture in production", () =>
    expect(() => assertActive({ ...principal, isFixture: true }, true)).toThrow(
      "unavailable",
    ));
  it("denies a consumer admin access", () =>
    expect(() => assertRole(principal, "admin")).toThrow("access"));
  it("accepts the required staff role", () =>
    expect(() =>
      assertRole({ ...principal, role: "admin" }, "admin"),
    ).not.toThrow());
});
describe("local fixture guard", () => {
  const valid = {
    DATABASE_URL: "postgresql://local@localhost/jado_dev",
    ALLOW_DEV_SEED: "true",
  };
  it("permits an explicitly opted-in local dev database", () =>
    expect(() => assertLocalDevelopmentDatabase(valid)).not.toThrow());
  it.each([
    { ...valid, NODE_ENV: "production" },
    { ...valid, ALLOW_DEV_SEED: "false" },
    { ...valid, DATABASE_URL: "postgresql://local@remote.invalid/jado_dev" },
    { ...valid, DATABASE_URL: "postgresql://local@localhost/customer_data" },
  ])("rejects an unsafe fixture target", (env) =>
    expect(() => assertLocalDevelopmentDatabase(env)).toThrow(),
  );
});
describe("safe inputs and environment", () => {
  it.each([
    "https://evil.invalid",
    "//evil.invalid",
    "/\\evil.invalid",
    "/sign-in",
    "\n/evil",
  ])("rejects an unsafe return destination", (value) =>
    expect(safeReturnPath(value)).toBe("/account"),
  );
  it("keeps a local return path", () =>
    expect(safeReturnPath("/admin?tab=overview")).toBe("/admin?tab=overview"));
  it("rejects privilege fields and invalid names", () => {
    expect(nameInput.safeParse({ name: "Name", role: "admin" }).success).toBe(
      false,
    );
    expect(nameInput.safeParse({ name: " " }).success).toBe(false);
    expect(nameInput.safeParse({ name: "bad\u0000name" }).success).toBe(false);
  });
  it("trims a valid name", () =>
    expect(nameInput.parse({ name: "  Ada  " })).toEqual({ name: "Ada" }));
  it("does not expose invalid secret values", () => {
    const secret = randomBytes(4).toString("hex");
    try {
      readConfig({ DATABASE_URL: "broken", BETTER_AUTH_SECRET: secret });
      throw new Error("Expected invalid config");
    } catch (error) {
      expect((error as Error).message).toContain("BETTER_AUTH_SECRET");
      expect((error as Error).message).not.toContain(secret);
    }
  });
  it("requires HTTPS for production", () =>
    expect(() =>
      readConfig({
        DATABASE_URL: "postgresql://local@localhost/db",
        APP_ORIGIN: "http://localhost:3000",
        BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
        NODE_ENV: "production",
      }),
    ).toThrow("HTTPS"));
});
describe("provider boundaries", () => {
  async function callAll(env: Record<string, string | undefined>) {
    const p = createProviders(env);
    return Promise.all([
      p.places.search("solar"),
      p.businessProfile.verifyManagement("TEST"),
      p.ai.recommend("solar"),
      p.whatsapp.notify({
        confirmedNumber: "TEST",
        conversationUrl: "/account",
      }),
      p.email.sendVerification({ email: "test@example.invalid", code: "TEST" }),
      p.storage.put({
        key: "TEST",
        content: new Uint8Array(),
        contentType: "text/plain",
      }),
    ]);
  }
  it("makes no network call with default disabled flags", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Unexpected network request"));
    const results = await callAll({});
    expect(
      results.every((result) => !result.ok && result.reason === "DISABLED"),
    ).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("requires a positive cap and never activates an unimplemented integration", async () => {
    const env = Object.fromEntries(
      [
        "GOOGLE_PLACES",
        "GOOGLE_BUSINESS_PROFILE",
        "AI",
        "WHATSAPP",
        "EMAIL",
        "STORAGE",
      ].map((prefix) => [`${prefix}_ENABLED`, "true"]),
    );
    expect(
      (await callAll(env)).every(
        (result) => !result.ok && result.reason === "BUDGET_NOT_APPROVED",
      ),
    ).toBe(true);
    for (const prefix of [
      "GOOGLE_PLACES",
      "GOOGLE_BUSINESS_PROFILE",
      "AI",
      "WHATSAPP",
      "EMAIL",
      "STORAGE",
    ])
      env[`${prefix}_SPEND_CAP_USD`] = "1";
    expect(
      (await callAll(env)).every(
        (result) => !result.ok && result.reason === "NOT_IMPLEMENTED",
      ),
    ).toBe(true);
  });
});
describe("HTTP boundaries", () => {
  it("rejects cross-site and missing-origin mutations", () => {
    expect(() =>
      assertSameOrigin(
        new Request("https://jado.invalid", {
          headers: { origin: "https://evil.invalid" },
        }),
        "https://jado.invalid",
      ),
    ).toThrow();
    expect(() =>
      assertSameOrigin(
        new Request("https://jado.invalid"),
        "https://jado.invalid",
      ),
    ).toThrow();
  });
  it("bounds input body size", async () =>
    expect(
      readJson(
        new Request("https://jado.invalid", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "x".repeat(5000) }),
        }),
      ),
    ).rejects.toMatchObject({ status: 413 }));
  it("rejects malformed JSON", async () =>
    expect(
      readJson(
        new Request("https://jado.invalid", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
      ),
    ).rejects.toMatchObject({ status: 400 }));
  it("returns a sanitized service error and a correlation ID", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = route(async () => {
      throw new Error("private-database-password");
    });
    const response = await handler(new Request("https://jado.invalid"));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).not.toContain("private-database-password");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
});
