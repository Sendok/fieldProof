CREATE TYPE "public"."draft_status" AS ENUM('ACTIVE', 'CONFLICTED');--> statement-breakpoint
CREATE TYPE "public"."evidence_category" AS ENUM('BEFORE', 'DURING', 'AFTER', 'ISSUE', 'DOCUMENT', 'SIGNATURE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."evidence_upload_status" AS ENUM('PENDING', 'READY', 'FAILED');--> statement-breakpoint
CREATE TABLE "evidence_files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"draft_id" uuid,
	"field_id" varchar(100),
	"category" "evidence_category" DEFAULT 'OTHER' NOT NULL,
	"upload_status" "evidence_upload_status" DEFAULT 'PENDING' NOT NULL,
	"original_filename" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" varchar(160) NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"checksum_sha256" varchar(64),
	"caption" text,
	"captured_at" timestamp with time zone,
	"latitude" double precision,
	"longitude" double precision,
	"uploaded_by_membership_id" uuid NOT NULL,
	"uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"evidence_file_id" uuid NOT NULL,
	"field_id" varchar(100) NOT NULL,
	"signer_membership_id" uuid NOT NULL,
	"consent_text" text NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"template_snapshot" jsonb NOT NULL,
	"answers_snapshot" jsonb NOT NULL,
	"evidence_snapshot" jsonb NOT NULL,
	"submitted_by_membership_id" uuid NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"app_version" varchar(80) NOT NULL,
	"location" jsonb,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"current_revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_order_drafts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"location" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "draft_status" DEFAULT 'ACTIVE' NOT NULL,
	"client_updated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "actual_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "actual_finished_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_draft_id_work_order_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."work_order_drafts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_uploaded_by_membership_id_memberships_id_fk" FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_evidence_file_id_evidence_files_id_fk" FOREIGN KEY ("evidence_file_id") REFERENCES "public"."evidence_files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_signer_membership_id_memberships_id_fk" FOREIGN KEY ("signer_membership_id") REFERENCES "public"."memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_revisions" ADD CONSTRAINT "submission_revisions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_revisions" ADD CONSTRAINT "submission_revisions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_revisions" ADD CONSTRAINT "submission_revisions_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_revisions" ADD CONSTRAINT "submission_revisions_submitted_by_membership_id_memberships_id_fk" FOREIGN KEY ("submitted_by_membership_id") REFERENCES "public"."memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_drafts" ADD CONSTRAINT "work_order_drafts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_drafts" ADD CONSTRAINT "work_order_drafts_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_drafts" ADD CONSTRAINT "work_order_drafts_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "evidence_files_storage_key_unique" ON "evidence_files" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "evidence_files_org_work_order_status_idx" ON "evidence_files" USING btree ("organization_id","work_order_id","upload_status");--> statement-breakpoint
CREATE INDEX "evidence_files_draft_idx" ON "evidence_files" USING btree ("draft_id");--> statement-breakpoint
CREATE UNIQUE INDEX "signatures_evidence_file_unique" ON "signatures" USING btree ("evidence_file_id");--> statement-breakpoint
CREATE INDEX "signatures_org_work_order_idx" ON "signatures" USING btree ("organization_id","work_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_revisions_submission_revision_unique" ON "submission_revisions" USING btree ("submission_id","revision");--> statement-breakpoint
CREATE INDEX "submission_revisions_org_work_order_idx" ON "submission_revisions" USING btree ("organization_id","work_order_id","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_work_order_unique" ON "submissions" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX "submissions_org_created_idx" ON "submissions" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "work_order_drafts_work_order_membership_unique" ON "work_order_drafts" USING btree ("work_order_id","membership_id");--> statement-breakpoint
CREATE INDEX "work_order_drafts_org_membership_idx" ON "work_order_drafts" USING btree ("organization_id","membership_id","updated_at");