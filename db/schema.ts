import type {
  BusinessPresentation,
  PostPresentation,
} from "@/lib/business-media";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const platformRole = pgEnum("platform_role", [
  "consumer",
  "moderator",
  "admin",
]);
export const accountState = pgEnum("account_state", [
  "active",
  "suspended",
  "deleted",
]);
export const businessState = pgEnum("business_state", [
  "pending",
  "verified_active",
  "disputed",
  "suspended",
  "closed",
]);
export const memberRole = pgEnum("member_role", ["owner", "manager"]);
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const user = pgTable("auth_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: platformRole("role").notNull().default("consumer"),
  state: accountState("state").notNull().default("active"),
  isFixture: boolean("is_fixture").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "auth_session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_idx").on(table.userId)],
);

export const account = pgTable(
  "auth_account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("account_provider_identity_idx").on(
      table.providerId,
      table.accountId,
    ),
    index("account_user_idx").on(table.userId),
  ],
);

export const verification = pgTable(
  "auth_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const rateLimit = pgTable("auth_rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// No Google-controlled business fields or activation endpoint exist in M0.
export const business = pgTable("business", {
  id: text("id").primaryKey(),
  googlePlaceId: text("google_place_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  status: businessState("status").notNull().default("pending"),
  isFixture: boolean("is_fixture").notNull().default(false),
  createdAt: createdAt(),
});
export const membership = pgTable(
  "business_membership",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull(),
    active: boolean("active").notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.businessId] }),
    index("membership_business_idx").on(table.businessId),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityId: text("entity_id").notNull(),
    requestId: text("request_id").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("audit_actor_created_idx").on(table.actorId, table.createdAt),
  ],
);

export const mutationLimit = pgTable(
  "mutation_limit",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  },
  (table) => [check("mutation_count_positive", sql`${table.count} > 0`)],
);

// M0.5 private prototype data, never verification evidence or production supply.
export const developmentCategory = pgTable("development_category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  seedKey: text("seed_key").notNull(),
});
export const developmentBusiness = pgTable(
  "development_business",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => developmentCategory.id),
    city: text("city").notNull(),
    neighbourhood: text("neighbourhood").notNull(),
    description: text("description").notNull(),
    tagline: text("tagline").notNull(),
    presentation: jsonb("presentation").$type<BusinessPresentation>(),
    tags: text("tags").array().notNull(),
    seedKey: text("seed_key").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("development_business_category_idx").on(t.categoryId),
    check("development_business_seed", sql`${t.seedKey} = 'jado-m05-v1'`),
  ],
);
export const developmentPost = pgTable(
  "development_post",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => developmentBusiness.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["service", "offer", "arrival", "update", "event", "portfolio"],
    }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    tags: text("tags").array().notNull(),
    priceNaira: integer("price_naira"),
    presentation: jsonb("presentation").$type<PostPresentation>(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    seedKey: text("seed_key").notNull(),
  },
  (t) => [
    index("development_post_business_idx").on(t.businessId),
    check(
      "development_price_positive",
      sql`${t.priceNaira} is null or ${t.priceNaira} >= 0`,
    ),
    check(
      "development_post_type",
      sql`${t.type} in ('service','offer','arrival','update','event','portfolio')`,
    ),
  ],
);
