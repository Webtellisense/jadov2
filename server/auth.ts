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
) {
  return betterAuth({
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
      disableSignUp: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
    },
    // Future Google OAuth is separate from GBP verification. No providers are connected.
    socialProviders: {},
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
      customRules: { "/sign-in/email": { window: 60, max: 5 } },
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
}
export type Auth = ReturnType<typeof createAuth>;
