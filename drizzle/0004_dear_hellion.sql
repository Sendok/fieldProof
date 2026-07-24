CREATE TYPE "public"."recurrence_frequency" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."work_order_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('DRAFT', 'SCHEDULED', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"email_assignments" boolean DEFAULT true NOT NULL,
	"email_schedule_changes" boolean DEFAULT true NOT NULL,
	"email_due_reminders" boolean DEFAULT true NOT NULL,
	"email_workflow_updates" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"recipient_membership_id" uuid NOT NULL,
	"type" varchar(64) NOT NULL,
	"title" varchar(240) NOT NULL,
	"body" text NOT NULL,
	"resource_type" varchar(100),
	"resource_id" uuid,
	"href" text,
	"read_at" timestamp with time zone,
	"email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_order_assignments" (
	"work_order_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"assigned_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_order_assignments_work_order_id_membership_id_pk" PRIMARY KEY("work_order_id","membership_id")
);
--> statement-breakpoint
CREATE TABLE "work_order_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" varchar(160) NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"from_status" "work_order_status",
	"to_status" "work_order_status" NOT NULL,
	"reason" text,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"number" varchar(40) NOT NULL,
	"title" varchar(240) NOT NULL,
	"description" text,
	"client_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"template_version_id" uuid NOT NULL,
	"priority" "work_order_priority" DEFAULT 'NORMAL' NOT NULL,
	"schedule_start" timestamp with time zone,
	"schedule_end" timestamp with time zone,
	"due_date" timestamp with time zone,
	"team_id" uuid,
	"supervisor_membership_id" uuid,
	"internal_notes" text,
	"instructions" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"client_visibility" boolean DEFAULT false NOT NULL,
	"client_approval_required" boolean DEFAULT false NOT NULL,
	"status" "work_order_status" DEFAULT 'DRAFT' NOT NULL,
	"cancellation_reason" text,
	"recurrence_frequency" "recurrence_frequency",
	"recurrence_interval" integer DEFAULT 1,
	"recurrence_end_at" timestamp with time zone,
	"recurrence_series_id" uuid,
	"recurrence_occurrence_at" timestamp with time zone,
	"row_version" integer DEFAULT 1 NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_membership_id_memberships_id_fk" FOREIGN KEY ("recipient_membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_assignments" ADD CONSTRAINT "work_order_assignments_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_attachments" ADD CONSTRAINT "work_order_attachments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_attachments" ADD CONSTRAINT "work_order_attachments_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_attachments" ADD CONSTRAINT "work_order_attachments_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_status_history" ADD CONSTRAINT "work_order_status_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_template_version_id_checklist_template_versions_id_fk" FOREIGN KEY ("template_version_id") REFERENCES "public"."checklist_template_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_supervisor_membership_id_memberships_id_fk" FOREIGN KEY ("supervisor_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_recipient_read_created_idx" ON "notifications" USING btree ("recipient_membership_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX "notifications_org_resource_idx" ON "notifications" USING btree ("organization_id","resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "work_order_assignments_membership_idx" ON "work_order_assignments" USING btree ("membership_id","work_order_id");--> statement-breakpoint
CREATE INDEX "work_order_attachments_org_work_order_idx" ON "work_order_attachments" USING btree ("organization_id","work_order_id");--> statement-breakpoint
CREATE INDEX "work_order_status_history_org_work_order_idx" ON "work_order_status_history" USING btree ("organization_id","work_order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "work_orders_org_number_unique" ON "work_orders" USING btree ("organization_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "work_orders_recurrence_occurrence_unique" ON "work_orders" USING btree ("organization_id","recurrence_series_id","recurrence_occurrence_at");--> statement-breakpoint
CREATE INDEX "work_orders_org_status_schedule_idx" ON "work_orders" USING btree ("organization_id","status","schedule_start");--> statement-breakpoint
CREATE INDEX "work_orders_org_client_site_idx" ON "work_orders" USING btree ("organization_id","client_id","site_id");--> statement-breakpoint
CREATE INDEX "work_orders_org_due_idx" ON "work_orders" USING btree ("organization_id","due_date");