CREATE TABLE "business_onboarding" (
	"business_id" text PRIMARY KEY NOT NULL,
	"applicant_user_id" text NOT NULL,
	"identity_source" text DEFAULT 'pre_approval_draft' NOT NULL,
	"details" jsonb NOT NULL,
	"step" text DEFAULT 'business-details' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_version_positive" CHECK ("business_onboarding"."version">0)
);
--> statement-breakpoint
CREATE TABLE "business_profile" (
	"source" text DEFAULT 'jado_user' NOT NULL,
	"business_id" text PRIMARY KEY NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"service_area" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"outcome" text NOT NULL,
	"reason_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "verification_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"actor_id" text,
	"event" text NOT NULL,
	"from_state" text,
	"to_state" text,
	"reason_code" text,
	"request_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business" ALTER COLUMN "google_place_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "gbp_location_id" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "lifecycle_state" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "reason_code" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_membership" ADD COLUMN "grant_source" text;--> statement-breakpoint
ALTER TABLE "business_membership" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_onboarding" ADD CONSTRAINT "business_onboarding_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_onboarding" ADD CONSTRAINT "business_onboarding_applicant_user_id_auth_user_id_fk" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profile" ADD CONSTRAINT "business_profile_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_audit_logs" ADD CONSTRAINT "verification_audit_logs_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_audit_logs" ADD CONSTRAINT "verification_audit_logs_actor_id_auth_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."auth_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "onboarding_applicant_idx" ON "business_onboarding" USING btree ("applicant_user_id");--> statement-breakpoint
CREATE INDEX "verification_audit_business_idx" ON "verification_audit_logs" USING btree ("business_id","created_at");--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_gbp_location_id_unique" UNIQUE("gbp_location_id");--> statement-breakpoint
ALTER TABLE "business" ADD CONSTRAINT "business_lifecycle_valid" CHECK ("business"."lifecycle_state" in ('draft','pending_gbp_approval','gbp_unverified','verified_eligible','published','reverification_required','suspended'));--> statement-breakpoint
UPDATE business SET lifecycle_state = CASE status WHEN 'verified_active' THEN 'reverification_required' WHEN 'disputed' THEN 'reverification_required' WHEN 'suspended' THEN 'suspended' ELSE 'draft' END,
 reason_code = CASE status WHEN 'verified_active' THEN 'LEGACY_RECHECK_REQUIRED' WHEN 'disputed' THEN 'OWNERSHIP_DISPUTED' WHEN 'closed' THEN 'LEGACY_CLOSED' ELSE NULL END,
 archived_at = CASE WHEN status='closed' THEN now() ELSE NULL END
 WHERE NOT is_fixture;
--> statement-breakpoint
CREATE FUNCTION reject_verification_audit_change() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Verification audit records are append-only'; END; $$;
--> statement-breakpoint
CREATE TRIGGER verification_audit_append_only BEFORE UPDATE OR DELETE ON verification_audit_logs FOR EACH ROW EXECUTE FUNCTION reject_verification_audit_change();

--> statement-breakpoint
INSERT INTO verification_audit_logs (id,business_id,event,from_state,to_state,reason_code,request_id)
 SELECT 'legacy-m25-'||id,id,'business.legacy_migrated',status::text,lifecycle_state,reason_code,'migration-0003'
 FROM business WHERE NOT is_fixture;
--> statement-breakpoint
CREATE TRIGGER verification_audit_no_truncate BEFORE TRUNCATE ON verification_audit_logs FOR EACH STATEMENT EXECUTE FUNCTION reject_verification_audit_change();
