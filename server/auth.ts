import { AsyncLocalStorage } from "node:async_hooks";
import { emailOTP } from "better-auth/plugins";
import { createMailTransport, type MailTransport } from "./email";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Database } from "@/db/connection";
import * as schema from "@/db/schema";
import type { Config } from "@/lib/config";

export function createAuth(
  db: Database,
  config: Config,
  production = process.env.NODE_ENV === "production",
  mail: MailTransport = createMailTransport(),
  env: Record<string, string | undefined> = process.env,
) {
  const delivery = new AsyncLocalStorage<{ failed: boolean }>();
  async function send(message: Parameters<MailTransport["send"]>[0]) {
    try {
      await mail.send(message);
    } catch {
      const context = delivery.getStore();
      if (context) context.failed = true;
      throw new APIError("SERVICE_UNAVAILABLE", {
        message: "Email delivery is unavailable.",
      });
    }
  }
  const auth = betterAuth({
    logger: {
      level: "error",
      log: (level) =>
        console.error(JSON.stringify({ event: "auth_error", level })),
    },
    appName: "Jado",
    baseURL: config.APP_ORIGIN,
    secret: config.BETTER_AUTH_SECRET,
    trustedOrigins: [config.APP_ORIGIN],
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !mail.available,
      requireEmailVerification: true,
      minPasswordLength: 12,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await send({
          to: user.email,
          subject: "Reset your Jado password",
          text: `Reset your password: ${url}`,
        });
      },
    },
    // Ordinary Google identity never confers GBP authorization.
    socialProviders:
      env.AUTH_GOOGLE_ENABLED === "true" &&
      env.AUTH_GOOGLE_CLIENT_ID &&
      env.AUTH_GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.AUTH_GOOGLE_CLIENT_ID,
              clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
              requireEmailVerification: true,
            },
          }
        : {},
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 300,
        allowedAttempts: 3,
        storeOTP: "hashed",
        sendVerificationOnSignUp: mail.available,
        overrideDefaultEmailVerification: true,
        sendVerificationOTP: async ({ email, otp, type }) => {
          if (type !== "email-verification")
            throw new APIError("FORBIDDEN", {
              message: "This email flow is unavailable.",
            });
          await send({
            to: email,
            subject: "Verify your Jado email",
            text: `Your Jado verification code is ${otp}. It expires in five minutes.`,
          });
        },
      }),
    ],
    account: { accountLinking: { enabled: false }, encryptOAuthTokens: true },
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 60,
      cookieCache: { enabled: false },
      storeSessionInDatabase: true,
    },
    user: {
      additionalFields: {
        role: {
          type: ["consumer", "moderator", "admin"],
          defaultValue: "consumer",
          input: false,
        },
        state: {
          type: ["active", "suspended", "deleted"],
          defaultValue: "active",
          input: false,
        },
        isFixture: { type: "boolean", defaultValue: false, input: false },
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 30,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
        "/request-password-reset": { window: 60, max: 3 },
        "/reset-password": { window: 60, max: 5 },
        "/callback/google": { window: 60, max: 10 },
      },
    },
    advanced: {
      // Keep security checks enabled in tests as well as in real requests.
      disableOriginCheck: false,
      disableCSRFCheck: false,
      useSecureCookies: production,
      database: { generateId: () => randomUUID() },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (newSession) => {
            const current = await db.query.user.findFirst({
              where: eq(schema.user.id, newSession.userId),
            });
            if (
              !current ||
              current.state !== "active" ||
              (production && current.isFixture)
            ) {
              throw new APIError("FORBIDDEN", {
                message: "This account is unavailable.",
              });
            }
          },
        },
      },
    },
  });
  return {
    ...auth,
    handler(request: Request) {
      return delivery.run({ failed: false }, async () => {
        const response = await auth.handler(request);
        // Better Auth intentionally catches mail callback errors. Never turn that into a delivery-success UI.
        if (delivery.getStore()?.failed)
          return Response.json(
            {
              error: "EMAIL_DELIVERY_FAILED",
              message: "Email delivery is unavailable. Please try again later.",
            },
            { status: 503 },
          );
        return response;
      });
    },
  };
}
export type Auth = ReturnType<typeof createAuth>;
