import { and, eq, inArray, sql, notExists } from "drizzle-orm";
import type { Database } from "./connection";
import { assertPrototypeSeedAllowed } from "./prototype-guard";
import {
  developmentBusiness as businesses,
  developmentCategory as categories,
  developmentPost as posts,
} from "./schema";
import {
  fixturePresentation,
  fixturePostPresentation,
} from "./prototype-presentation";
export const seedKey = "jado-m05-v1";
const categoryRows = [
  { id: "solar", name: "Solar and power", icon: "solar" },
  { id: "food", name: "Food and drink", icon: "food" },
  { id: "beauty", name: "Beauty and wellness", icon: "beauty" },
  { id: "home", name: "Home services", icon: "home" },
  { id: "fashion", name: "Fashion", icon: "fashion" },
  { id: "education", name: "Education", icon: "education" },
  { id: "tech", name: "Tech and accessories", icon: "other" },
];
const entries = [
  [
    "amber-roof",
    "Amber Roof Solar",
    "solar",
    "Ewet Housing",
    "Solar installations, inverter servicing and backup power planning.",
    "A brighter plan for your home.",
    "solar inverter installation battery",
    "Home solar assessment",
    null,
  ],
  [
    "daybreak",
    "Daybreak Power Studio",
    "solar",
    "Shelter Afrique",
    "Home and small-shop solar systems, battery upgrades and maintenance.",
    "Power for the everyday.",
    "solar panels battery maintenance",
    "3.5kVA backup system",
    1250000,
  ],
  [
    "sunward",
    "Sunward Energy Workshop",
    "solar",
    "Itam",
    "Solar repairs, inverter diagnostics and power-system design.",
    "Thoughtful energy, made local.",
    "solar repair inverter diagnostics",
    "Inverter diagnostic visit",
    25000,
  ],
  [
    "pepper-clay",
    "Pepper & Clay Kitchen",
    "food",
    "Ewet Housing",
    "Freshly prepared lunch bowls, small-event catering and local favourites.",
    "Something good for lunch.",
    "food lunch catering rice",
    "Lunch bowl selection",
    4500,
  ],
  [
    "crumb-cove",
    "Crumb Cove Bakery",
    "food",
    "Osongama",
    "Small-batch bread, celebration cakes and pastries made to order.",
    "A little joy, freshly baked.",
    "bakery bread cake pastries",
    "Weekend pastry box",
    8000,
  ],
  [
    "soft-hour",
    "Soft Hour Studio",
    "beauty",
    "Shelter Afrique",
    "Hair care, natural styling and appointment-based beauty services.",
    "Make a little time for you.",
    "hair beauty braids styling",
    "Natural hair care session",
    15000,
  ],
  [
    "tidy-nest",
    "Tidy Nest Home Care",
    "home",
    "Itam",
    "Home cleaning, move-in preparation and fabric care services.",
    "Come home to a fresh start.",
    "cleaning home upholstery",
    "Two-bedroom home clean",
    30000,
  ],
  [
    "thread-lane",
    "Thread Lane Atelier",
    "fashion",
    "Osongama",
    "Made-to-measure everyday wear and thoughtful clothing alterations.",
    "Made to feel like you.",
    "fashion tailoring alterations clothing",
    "Everyday linen collection",
    28000,
  ],
  [
    "little-ladder",
    "Little Ladder Learning",
    "education",
    "Ewet Housing",
    "After-school reading, maths support and creative weekend lessons.",
    "Small steps. Growing confidence.",
    "tutor learning maths reading",
    "Weekend creative workshop",
    12000,
  ],
  [
    "pocket-beam",
    "Pocket Beam Supply",
    "tech",
    "Itam",
    "Creator accessories, phone stands and compact lighting for small businesses.",
    "Small tools, bright ideas.",
    "ring light phone stand lighting accessories",
    "18-inch ring light kit",
    42000,
  ],
] as const;
export const prototypeIds = entries.map((e) => `demo-${e[0]}`);
export async function seedPrototype(
  db: Database,
  env: Record<string, string | undefined> = process.env,
) {
  assertPrototypeSeedAllowed(env);
  return seedPrototypeRows(db);
}

async function seedPrototypeRows(db: Database) {
  await db.transaction(async (tx) => {
    for (const row of categoryRows) {
      const existing = await tx
        .select()
        .from(categories)
        .where(eq(categories.id, row.id));
      if (existing.some((e) => e.seedKey !== seedKey))
        throw new Error("Category seed collision.");
      await tx
        .insert(categories)
        .values({ ...row, seedKey })
        .onConflictDoNothing();
    }
    for (const [i, e] of entries.entries()) {
      const id = prototypeIds[i];
      const existing = await tx
        .select()
        .from(businesses)
        .where(eq(businesses.id, id));
      if (existing.some((e) => e.seedKey !== seedKey))
        throw new Error("Business seed collision.");
      const presentation = fixturePresentation(e[0], e[1], e[3], e[7], e[8], i);
      await tx
        .insert(businesses)
        .values({
          id,
          slug: e[0],
          name: e[1],
          categoryId: e[2],
          city: "Uyo",
          neighbourhood: e[3],
          description: e[4],
          tagline: e[5],
          presentation,
          tags: e[6].split(" "),
          seedKey,
          createdAt: new Date(
            `2026-11-${String(15 - i).padStart(2, "0")}T09:00:00Z`,
          ),
        })
        .onConflictDoUpdate({
          target: businesses.id,
          set: { presentation },
          setWhere: eq(businesses.seedKey, seedKey),
        });
      const postTypes = {
        "amber-roof": "service",
        daybreak: "portfolio",
        sunward: "update",
        "pepper-clay": "service",
        "crumb-cove": "arrival",
        "soft-hour": "service",
        "tidy-nest": "service",
        "thread-lane": "portfolio",
        "little-ladder": "event",
        "pocket-beam": "arrival",
      } as const satisfies Record<
        (typeof entries)[number][0],
        typeof posts.$inferInsert.type
      >;
      for (const offer of [false, true]) {
        const postId = `${id}-${offer ? "offer" : "post"}`;
        const existingPost = await tx
          .select()
          .from(posts)
          .where(eq(posts.id, postId));
        if (
          existingPost.some((e) => e.seedKey !== seedKey || e.businessId !== id)
        )
          throw new Error("Post seed collision.");
        const type = offer ? "offer" : postTypes[e[0]];
        const postPresentation = fixturePostPresentation(
          type,
          presentation.gallery,
          i,
        );
        const description = `${e[4]} ${offer ? "An introductory package. Ask about the full scope before deciding." : "Contact the business to discuss the details and availability."}`;
        await tx
          .insert(posts)
          .values({
            id: postId,
            businessId: id,
            type,
            presentation: postPresentation,
            title: offer ? `${e[7]} · introductory offer` : e[7],
            description,
            tags: e[6].split(" "),
            priceNaira: e[8],
            publishedAt:
              offer && i === 2
                ? new Date("2026-10-25T08:00:00Z")
                : new Date(
                    `2026-11-${String(16 - (i % 5)).padStart(2, "0")}T08:00:00Z`,
                  ),
            expiresAt: offer
              ? new Date(
                  i === 2 ? "2026-11-01T23:59:59Z" : "2026-12-31T23:59:59Z",
                )
              : null,
            seedKey,
          })
          .onConflictDoUpdate({
            target: posts.id,
            set: { presentation: postPresentation, description },
            setWhere: and(eq(posts.seedKey, seedKey), eq(posts.businessId, id)),
          });
      }
    }
  });
}
export async function undoPrototype(
  db: Database,
  env: Record<string, string | undefined> = process.env,
) {
  assertPrototypeSeedAllowed(env);
  return undoPrototypeRows(db);
}

async function undoPrototypeRows(db: Database) {
  await db.transaction(async (tx) => {
    const owned = await tx
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(
          inArray(posts.businessId, prototypeIds),
          sql`${posts.seedKey} <> ${seedKey}`,
        ),
      );
    if (owned.length)
      throw new Error(
        "Fixture businesses contain unrelated posts; refusing undo.",
      );
    await tx
      .delete(businesses)
      .where(
        and(
          eq(businesses.seedKey, seedKey),
          inArray(businesses.id, prototypeIds),
        ),
      );
    await tx.delete(categories).where(
      and(
        eq(categories.seedKey, seedKey),
        inArray(
          categories.id,
          categoryRows.map((c) => c.id),
        ),
        notExists(
          tx
            .select({ id: businesses.id })
            .from(businesses)
            .where(eq(businesses.categoryId, categories.id)),
        ),
      ),
    );
  });
}
