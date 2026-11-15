import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Database } from "@/db/connection";
import { auditLog, mutationLimit, user } from "@/db/schema";
import { assertActive, type Principal } from "./authorization";
import { AppError } from "./errors";

export const nameInput = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .refine((value) => !/[\u0000-\u001f\u007f]/.test(value)),
  })
  .strict();
export async function updateName(
  db: Database,
  principal: Principal,
  input: unknown,
  requestId: string,
) {
  assertActive(principal);
  const parsed = nameInput.safeParse(input);
  if (!parsed.success)
    throw new AppError(
      400,
      "INVALID_INPUT",
      "Enter a name between 2 and 80 characters.",
    );
  return db.transaction(async (tx) => {
    // Recheck authorization while holding the account row lock, including concurrent suspension.
    const [current] = await tx
      .select()
      .from(user)
      .where(eq(user.id, principal.id))
      .for("update");
    assertActive(current);
    const [limit] = await tx
      .insert(mutationLimit)
      .values({
        key: `account-name:${principal.id}`,
        count: 1,
        windowStart: new Date(),
      })
      .onConflictDoUpdate({
        target: mutationLimit.key,
        set: {
          count: sql`CASE WHEN ${mutationLimit.windowStart} <= now() - interval '1 minute' THEN 1 ELSE ${mutationLimit.count} + 1 END`,
          windowStart: sql`CASE WHEN ${mutationLimit.windowStart} <= now() - interval '1 minute' THEN now() ELSE ${mutationLimit.windowStart} END`,
        },
      })
      .returning();
    if (limit.count > 10)
      throw new AppError(
        429,
        "RATE_LIMITED",
        "Too many changes. Please try again in a minute.",
      );
    const [saved] = await tx
      .update(user)
      .set({ name: parsed.data.name, updatedAt: new Date() })
      .where(eq(user.id, principal.id))
      .returning({ name: user.name });
    await tx
      .insert(auditLog)
      .values({
        id: randomUUID(),
        actorId: principal.id,
        action: "account.name_updated",
        entityId: principal.id,
        requestId,
      });
    return saved;
  });
}
