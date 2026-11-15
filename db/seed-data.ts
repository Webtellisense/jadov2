import { hashPassword } from "better-auth/crypto";
import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Database } from "./connection";
import { account, auditLog, business, mutationLimit, user } from "./schema";
import { assertLocalDevelopmentDatabase } from "./dev-guard";

export const fixtureUsers = [
  {
    id: "dev-consumer",
    email: "consumer@example.invalid",
    name: "[DEV FIXTURE] Consumer",
    role: "consumer" as const,
  },
  {
    id: "dev-admin",
    email: "admin@example.invalid",
    name: "[DEV FIXTURE] Admin",
    role: "admin" as const,
  },
];
export async function seedDevelopment(
  db: Database,
  env: Record<string, string | undefined> = process.env,
) {
  assertLocalDevelopmentDatabase(env);
  const password = env.DEV_SEED_PASSWORD;
  if (!password || password.length < 12)
    throw new Error(
      "Set DEV_SEED_PASSWORD to a local password of at least 12 characters.",
    );
  const hashed = await hashPassword(password);
  await db.transaction(async (tx) => {
    // Refuse collisions; never overwrite an existing nonfixture identity or account.
    for (const fixture of fixtureUsers) {
      const existing = await tx.query.user.findFirst({
        where: eq(user.id, fixture.id),
      });
      if (existing && !existing.isFixture)
        throw new Error("A seed identity collides with a nonfixture user.");
      await tx
        .insert(user)
        .values({ ...fixture, emailVerified: true, isFixture: true })
        .onConflictDoNothing({ target: user.id });
      const credential = await tx.query.account.findFirst({
        where: and(
          eq(account.userId, fixture.id),
          eq(account.providerId, "credential"),
        ),
      });
      if (credential)
        await tx
          .update(account)
          .set({ password: hashed, updatedAt: new Date() })
          .where(eq(account.id, credential.id));
      else
        await tx
          .insert(account)
          .values({
            id: randomUUID(),
            userId: fixture.id,
            accountId: fixture.id,
            providerId: "credential",
            password: hashed,
          });
    }
    // This fixture is pending and has no membership or verification evidence.
    const existingBusiness = await tx.query.business.findFirst({
      where: eq(business.id, "dev-pending-business"),
    });
    if (existingBusiness && !existingBusiness.isFixture)
      throw new Error("A seed business collides with a nonfixture business.");
    await tx
      .insert(business)
      .values({
        id: "dev-pending-business",
        googlePlaceId: "DEV_FIXTURE_NOT_A_GOOGLE_PLACE",
        slug: "dev-fixture-pending",
        isFixture: true,
      })
      .onConflictDoNothing({ target: business.id });
  });
}
export async function undoDevelopmentSeed(
  db: Database,
  env: Record<string, string | undefined> = process.env,
) {
  assertLocalDevelopmentDatabase(env);
  await db.transaction(async (tx) => {
    const ids = fixtureUsers.map((item) => item.id);
    const removable = await tx
      .select({ id: user.id })
      .from(user)
      .where(and(inArray(user.id, ids), eq(user.isFixture, true)));
    for (const item of removable) {
      await tx.delete(auditLog).where(eq(auditLog.actorId, item.id));
      await tx
        .delete(mutationLimit)
        .where(eq(mutationLimit.key, `account-name:${item.id}`));
      await tx.delete(user).where(eq(user.id, item.id));
    }
    await tx
      .delete(business)
      .where(
        and(
          eq(business.id, "dev-pending-business"),
          eq(business.isFixture, true),
        ),
      );
  });
}
