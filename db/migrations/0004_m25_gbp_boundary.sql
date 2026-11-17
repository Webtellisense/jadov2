CREATE TABLE "business_gbp_locations" (
	"business_id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"account_name" text NOT NULL,
	"location_name" text NOT NULL,
	"role" text NOT NULL,
	"role_source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gbp_business_connections" (
	"business_id" text NOT NULL,
	"user_id" text NOT NULL,
	"connection_id" text NOT NULL,
	CONSTRAINT "gbp_business_connections_business_id_user_id_pk" PRIMARY KEY("business_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "gbp_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"google_subject" text NOT NULL,
	"access_cipher" text,
	"refresh_cipher" text,
	"scopes" text[] NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gbp_connection_status" CHECK ("gbp_connections"."status" in ('connected','reauthorization_required','revocation_pending','revoked'))
);
--> statement-breakpoint
CREATE TABLE "gbp_oauth_states" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_id" text NOT NULL,
	"session_hash" text NOT NULL,
	"cookie_hash" text NOT NULL,
	"nonce_hash" text NOT NULL,
	"verifier_cipher" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "last_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "proof_valid_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_verifications" ADD COLUMN "connection_id" text;--> statement-breakpoint
ALTER TABLE "business_verifications" ADD COLUMN "location_name" text;--> statement-breakpoint
ALTER TABLE "business_verifications" ADD COLUMN "voice_of_merchant" boolean;--> statement-breakpoint
ALTER TABLE "business_verifications" ADD COLUMN "role_evidence" text;--> statement-breakpoint
ALTER TABLE "business_gbp_locations" ADD CONSTRAINT "business_gbp_locations_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_gbp_locations" ADD CONSTRAINT "business_gbp_locations_connection_id_gbp_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."gbp_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gbp_business_connections" ADD CONSTRAINT "gbp_business_connections_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gbp_business_connections" ADD CONSTRAINT "gbp_business_connections_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gbp_business_connections" ADD CONSTRAINT "gbp_business_connections_connection_id_gbp_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."gbp_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gbp_connections" ADD CONSTRAINT "gbp_connections_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gbp_oauth_states" ADD CONSTRAINT "gbp_oauth_states_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gbp_oauth_states" ADD CONSTRAINT "gbp_oauth_states_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gbp_user_subject_unique" ON "gbp_connections" USING btree ("user_id","google_subject");--> statement-breakpoint
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_connection_id_gbp_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."gbp_connections"("id") ON DELETE no action ON UPDATE no action;