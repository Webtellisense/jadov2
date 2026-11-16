CREATE TABLE "development_business" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category_id" text NOT NULL,
	"city" text NOT NULL,
	"neighbourhood" text NOT NULL,
	"description" text NOT NULL,
	"tagline" text NOT NULL,
	"tags" text[] NOT NULL,
	"seed_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "development_business_slug_unique" UNIQUE("slug"),
	CONSTRAINT "development_business_seed" CHECK ("development_business"."seed_key" = 'jado-m05-v1')
);
--> statement-breakpoint
CREATE TABLE "development_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"seed_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "development_post" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"tags" text[] NOT NULL,
	"price_naira" integer,
	"published_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"seed_key" text NOT NULL,
	CONSTRAINT "development_price_positive" CHECK ("development_post"."price_naira" is null or "development_post"."price_naira" >= 0),
	CONSTRAINT "development_post_type" CHECK ("development_post"."type" in ('service','offer','arrival','update','event','portfolio'))
);
--> statement-breakpoint
ALTER TABLE "development_business" ADD CONSTRAINT "development_business_category_id_development_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."development_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "development_post" ADD CONSTRAINT "development_post_business_id_development_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."development_business"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "development_business_category_idx" ON "development_business" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "development_post_business_idx" ON "development_post" USING btree ("business_id");