import { randomUUID } from "node:crypto";
import { and, desc, eq, or, sql } from "drizzle-orm";
import type { Database } from "@/db/connection";
import {
  business,
  businessOnboarding,
  businessProfile,
  membership,
  mutationLimit,
  user,
  verificationAudit,
} from "@/db/schema";
import { draftDetailsSchema, draftSaveSchema } from "@/lib/business-draft";
import { assertActive, type Principal } from "./authorization";
import { AppError } from "./errors";

type Store = Pick<Database, "query" | "select" | "insert">;
export async function requireVerifiedAccount(db: Store, principal: Principal) {
  assertActive(principal);
  const current = await db.query.user.findFirst({
    where: eq(user.id, principal.id),
  });
  assertActive(current);
  if (current.isFixture)
    throw new AppError(
      403,
      "REAL_ACCOUNT_REQUIRED",
      "Development accounts cannot onboard real businesses.",
    );
  if (!current.emailVerified)
    throw new AppError(
      403,
      "EMAIL_VERIFICATION_REQUIRED",
      "Verify your email before adding a business.",
    );
  return current;
}
export async function listBusinessDrafts(db: Database, principal: Principal) {
  await requireVerifiedAccount(db, principal);
  return db
    .select({
      id: business.id,
      state: business.lifecycleState,
      reason: business.reasonCode,
      details: businessOnboarding.details,
      version: businessOnboarding.version,
      identityLocked: sql<boolean>`${business.gbpLocationId} is not null`,
    })
    .from(business)
    .innerJoin(
      businessOnboarding,
      eq(business.id, businessOnboarding.businessId),
    )
    .where(
      and(
        eq(business.isFixture, false),
        or(
          eq(businessOnboarding.applicantUserId, principal.id),
          sql`exists (select 1 from business_membership m where m.business_id=${business.id} and m.user_id=${principal.id} and m.active=true)`,
        ),
      ),
    )
    .orderBy(desc(business.createdAt));
}
export async function readBusinessDraft(
  db: Database,
  principal: Principal,
  id: string,
) {
  await requireVerifiedAccount(db, principal);
  const rows = await listBusinessDrafts(db, principal);
  const row = rows.find((b) => b.id === id);
  if (!row) throw new AppError(404, "NOT_FOUND", "Business draft not found.");
  return row;
}
export async function createBusinessDraft(
  db: Database,
  principal: Principal,
  input: unknown,
  requestId: string,
) {
  const parsed = draftDetailsSchema.safeParse(input);
  if (!parsed.success)
    throw new AppError(400, "INVALID_INPUT", "Check the business details.");
  return db.transaction(async (tx) => {
    await tx.select().from(user).where(eq(user.id, principal.id)).for("update");
    await requireVerifiedAccount(tx, principal);
    await limit(tx, principal.id);
    const id = randomUUID();
    await tx
      .insert(business)
      .values({ id, slug: `business-${id}`, lifecycleState: "draft" });
    await tx.insert(businessOnboarding).values({
      businessId: id,
      applicantUserId: principal.id,
      details: parsed.data,
    });
    await tx.insert(businessProfile).values({
      businessId: id,
      description: parsed.data.description,
      serviceArea: parsed.data.serviceArea,
    });
    await tx.insert(verificationAudit).values([
      {
        id: randomUUID(),
        businessId: id,
        actorId: principal.id,
        event: "draft.created",
        toState: "draft",
        requestId,
      },
      {
        id: randomUUID(),
        businessId: id,
        actorId: principal.id,
        event: "business.state_changed",
        fromState: "draft",
        toState: "pending_gbp_approval",
        reasonCode: "GBP_ACCESS_PENDING",
        requestId,
      },
    ]);
    await tx
      .update(business)
      .set({
        lifecycleState: "pending_gbp_approval",
        reasonCode: "GBP_ACCESS_PENDING",
      })
      .where(eq(business.id, id));
    return { id };
  });
}
export async function saveBusinessDraft(
  db: Database,
  principal: Principal,
  id: string,
  input: unknown,
  requestId: string,
) {
  const parsed = draftSaveSchema.safeParse(input);
  if (!parsed.success)
    throw new AppError(400, "INVALID_INPUT", "Check the business details.");
  return db.transaction(async (tx) => {
    await tx.select().from(user).where(eq(user.id, principal.id)).for("update");
    await requireVerifiedAccount(tx, principal);
    const [row] = await tx
      .select()
      .from(business)
      .where(eq(business.id, id))
      .for("update");
    const [draft] = await tx
      .select()
      .from(businessOnboarding)
      .where(eq(businessOnboarding.businessId, id))
      .for("update");
    const [member] = await tx
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.userId, principal.id),
          eq(membership.businessId, id),
          eq(membership.active, true),
        ),
      )
      .for("update");
    if (
      !row ||
      row.isFixture ||
      !draft ||
      (draft.applicantUserId !== principal.id && !member)
    )
      throw new AppError(404, "NOT_FOUND", "Business draft not found.");
    if (
      row.archivedAt ||
      row.lifecycleState === "suspended" ||
      ![
        "draft",
        "pending_gbp_approval",
        "gbp_unverified",
        "reverification_required",
        "verified_eligible",
      ].includes(row.lifecycleState)
    )
      throw new AppError(
        403,
        "DRAFT_EDIT_UNAVAILABLE",
        "This draft cannot be edited here.",
      );
    if (
      row.gbpLocationId &&
      (
        ["name", "category", "location", "address", "phone", "website"] as const
      ).some((key) => parsed.data.details[key] !== draft.details[key])
    )
      throw new AppError(
        403,
        "GOOGLE_IDENTITY_LOCKED",
        "The selected Google identity is read-only. Provisional values are retained privately until live synchronization is approved.",
      );
    if (draft.version !== parsed.data.version)
      throw new AppError(
        409,
        "VERSION_CONFLICT",
        "This draft changed. Reload before saving again.",
      );
    await limit(tx, principal.id);
    if (
      row.lifecycleState === "verified_eligible" &&
      (!parsed.data.details.description.trim() ||
        (draft.details.contactEmail &&
          !parsed.data.details.contactEmail &&
          !draft.details.phone &&
          !draft.details.website) ||
        (draft.details.serviceArea &&
          !parsed.data.details.serviceArea &&
          !draft.details.location &&
          !draft.details.address))
    ) {
      await tx
        .update(business)
        .set({
          lifecycleState: "draft",
          reasonCode: "PROFILE_RECHECK_REQUIRED",
        })
        .where(eq(business.id, id));
      await tx.insert(verificationAudit).values({
        id: randomUUID(),
        businessId: id,
        actorId: principal.id,
        event: "business.state_changed",
        fromState: row.lifecycleState,
        toState: "draft",
        reasonCode: "PROFILE_RECHECK_REQUIRED",
        requestId,
      });
    }
    await tx
      .update(businessOnboarding)
      .set({
        details: parsed.data.details,
        version: draft.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(businessOnboarding.businessId, id));
    await tx
      .update(businessProfile)
      .set({
        description: parsed.data.details.description,
        serviceArea: parsed.data.details.serviceArea,
        updatedAt: new Date(),
      })
      .where(eq(businessProfile.businessId, id));
    await tx.insert(verificationAudit).values({
      id: randomUUID(),
      businessId: id,
      actorId: principal.id,
      event: "draft.saved",
      reasonCode: "PROVISIONAL_IDENTITY",
      requestId,
    });
    return { version: draft.version + 1 };
  });
}
async function limit(db: Store, userId: string) {
  const [row] = await db
    .insert(mutationLimit)
    .values({
      key: `business-draft:${userId}`,
      count: 1,
      windowStart: new Date(),
    })
    .onConflictDoUpdate({
      target: mutationLimit.key,
      set: {
        count: sql`case when ${mutationLimit.windowStart} < now()-interval '1 minute' then 1 else ${mutationLimit.count}+1 end`,
        windowStart: sql`case when ${mutationLimit.windowStart} < now()-interval '1 minute' then now() else ${mutationLimit.windowStart} end`,
      },
    })
    .returning();
  if (row.count > 20)
    throw new AppError(
      429,
      "RATE_LIMITED",
      "Too many changes. Wait a minute and try again.",
    );
}
