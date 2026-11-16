import { and, asc, desc, eq, exists, ilike, or, sql } from "drizzle-orm";
import type { Database } from "@/db/connection";
import {
  developmentBusiness as b,
  developmentCategory as c,
  developmentPost as p,
} from "@/db/schema";
import type { DiscoveryData, Filters } from "@/lib/discovery";
export async function readPrototype(
  db: Database,
  filters: Filters,
  now = new Date(),
): Promise<DiscoveryData> {
  const predicates = [eq(b.seedKey, "jado-m05-v1")];
  if (filters.area) predicates.push(eq(b.city, filters.area));
  else predicates.push(sql`false`);
  if (filters.category) predicates.push(eq(b.categoryId, filters.category));
  const current = sql`(${p.expiresAt} is null or ${p.expiresAt} > ${now})`;
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    predicates.push(
      or(
        ilike(b.name, pattern),
        ilike(b.description, pattern),
        ilike(c.name, pattern),
        sql`array_to_string(${b.tags}, ' ') ilike ${pattern}`,
        exists(
          db
            .select({ id: p.id })
            .from(p)
            .where(
              and(
                eq(p.businessId, b.id),
                current,
                or(
                  ilike(p.title, pattern),
                  ilike(p.description, pattern),
                  sql`array_to_string(${p.tags}, ' ') ilike ${pattern}`,
                ),
              ),
            ),
        ),
      )!,
    );
  }
  if (filters.offers === "yes")
    predicates.push(
      exists(
        db
          .select({ id: p.id })
          .from(p)
          .where(and(eq(p.businessId, b.id), current, eq(p.type, "offer"))),
      ),
    );
  if (filters.type)
    predicates.push(
      exists(
        db
          .select({ id: p.id })
          .from(p)
          .where(
            and(eq(p.businessId, b.id), current, eq(p.type, filters.type)),
          ),
      ),
    );
  const rows = await db
    .select({
      id: b.id,
      slug: b.slug,
      name: b.name,
      categoryId: b.categoryId,
      categoryName: c.name,
      icon: c.icon,
      city: b.city,
      neighbourhood: b.neighbourhood,
      description: b.description,
      tagline: b.tagline,
      presentation: b.presentation,
      tags: b.tags,
      createdAt: b.createdAt,
    })
    .from(b)
    .innerJoin(c, eq(c.id, b.categoryId))
    .where(and(...predicates))
    .orderBy(
      filters.sort === "newest"
        ? desc(b.createdAt)
        : filters.sort === "active"
          ? desc(
              sql`(select max(published_at) from development_post where business_id=${b.id})`,
            )
          : asc(b.name),
    )
    .limit(50);
  const postRows = await db
    .select()
    .from(p)
    .where(eq(p.seedKey, "jado-m05-v1"))
    .orderBy(desc(p.publishedAt))
    .limit(100);
  return {
    businesses: rows,
    posts: postRows.filter((post) =>
      rows.some((biz) => biz.id === post.businessId),
    ),
    categories: await db
      .select({ id: c.id, name: c.name, icon: c.icon })
      .from(c)
      .where(eq(c.seedKey, "jado-m05-v1"))
      .orderBy(asc(c.name)),
  };
}
