import { expect, it, vi, afterEach } from "vitest";
import { draftDetailsSchema, draftSaveSchema } from "@/lib/business-draft";
import { authEndpointAllowed } from "@/server/auth-surface";
import { createMailTransport } from "@/server/email";
import { fixturesVisible } from "@/server/fixture-policy";
afterEach(() => vi.restoreAllMocks());
it("rejects status, owner role and canonical ID injection", () => {
  for (const field of [
    "status",
    "lifecycleState",
    "gbpLocationId",
    "googlePlaceId",
    "role",
  ])
    expect(
      draftDetailsSchema.safeParse({
        name: "A real applicant",
        [field]: "published",
      }).success,
    ).toBe(false);
  expect(
    draftSaveSchema.safeParse({ version: -1, details: { name: "Test" } })
      .success,
  ).toBe(false);
});
it("allows a service-area business without a website or storefront", () => {
  expect(
    draftDetailsSchema.parse({ name: "Service business", serviceArea: "Uyo" })
      .website,
  ).toBe("");
  expect(
    draftDetailsSchema.safeParse({
      name: "Test",
      website: "javascript:alert(1)",
    }).success,
  ).toBe(false);
});
it("fixture supply is explicit on staging and denied on real production", () => {
  expect(
    fixturesVisible({ APP_ENV: "staging", JADO_FIXTURES_VISIBLE: "true" }),
  ).toBe(true);
  expect(fixturesVisible({ APP_ENV: "staging" })).toBe(false);
  expect(
    fixturesVisible({ APP_ENV: "production", JADO_FIXTURES_VISIBLE: "true" }),
  ).toBe(false);
});
it("keeps unconfigured auth routes, linking and GBP out of the auth surface", () => {
  for (const path of [
    "/sign-up/email",
    "/sign-in/social",
    "/callback/google",
    "/link-social",
    "/email-otp/verify-email",
    "/gbp/oauth/callback",
  ])
    expect(authEndpointAllowed("POST", path, {})).toBe(false);
  const env = {
    EMAIL_ENABLED: "true",
    EMAIL_PROVIDER: "resend",
    EMAIL_API_KEY: "test",
    EMAIL_FROM: "test@example.invalid",
  };
  expect(authEndpointAllowed("POST", "/sign-up/email", env)).toBe(true);
  expect(
    authEndpointAllowed("POST", "/email-otp/get-verification-otp", env),
  ).toBe(false);
  expect(authEndpointAllowed("POST", "/sign-in/email-otp", env)).toBe(false);
});
it("disabled email makes no network request; failed delivery never succeeds", async () => {
  const send = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response("", { status: 503 }));
  await expect(
    createMailTransport({}).send({
      to: "person@example.invalid",
      subject: "test",
      text: "test",
    }),
  ).rejects.toMatchObject({ code: "EMAIL_UNAVAILABLE" });
  expect(send).not.toHaveBeenCalled();
  const mail = createMailTransport({
    EMAIL_ENABLED: "true",
    EMAIL_PROVIDER: "resend",
    EMAIL_API_KEY: "test-only",
    EMAIL_FROM: "sender@example.invalid",
  });
  await expect(
    mail.send({ to: "person@example.invalid", subject: "test", text: "test" }),
  ).rejects.toMatchObject({ code: "EMAIL_DELIVERY_FAILED" });
});
