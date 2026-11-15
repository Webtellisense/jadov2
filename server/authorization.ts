import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/connection";
import { business, membership, user } from "@/db/schema";
import { AppError } from "./errors";
import type { Auth } from "./auth";

export type Principal = Pick<
  typeof user.$inferSelect,
  "id" | "name" | "email" | "role" | "state" | "isFixture"
>;
export function assertActive(
  principal: Principal | null | undefined,
  production = process.env.NODE_ENV === "production",
): asserts principal is Principal {
  if (!principal)
    throw new AppError(401, "UNAUTHENTICATED", "Sign in to continue.");
  if (principal.state !== "active" || (production && principal.isFixture)) {
    throw new AppError(
      403,
      "ACCOUNT_UNAVAILABLE",
      "This account is unavailable.",
    );
  }
}
export function assertRole(principal: Principal, role: Principal["role"]) {
  assertActive(principal);
  if (principal.role !== role)
    throw new AppError(
      403,
      "FORBIDDEN",
      "You do not have access to this area.",
    );
}
export async function requirePrincipal(
  db: Database,
  auth: Auth,
  headers: Headers,
): Promise<Principal> {
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
  const principal = session
    ? await db.query.user.findFirst({ where: eq(user.id, session.user.id) })
    : null;
  assertActive(principal);
  return principal;
}
export async function requireBusinessAccess(
  db: Database,
  principal: Principal,
  businessId: string,
) {
  assertActive(principal);
  const [access] = await db
    .select({
      role: membership.role,
      active: membership.active,
      status: business.status,
      isFixture: business.isFixture,
    })
    .from(membership)
    .innerJoin(business, eq(business.id, membership.businessId))
    .where(
      and(
        eq(membership.userId, principal.id),
        eq(membership.businessId, businessId),
      ),
    );
  if (
    !access?.active ||
    access.status !== "verified_active" ||
    (process.env.NODE_ENV === "production" && access.isFixture)
  ) {
    throw new AppError(
      403,
      "BUSINESS_ACCESS_REQUIRED",
      "Active authorization for this business is required.",
    );
  }
  return access;
}
