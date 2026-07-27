ALTER TABLE "work_orders" ADD COLUMN "target_latitude" double precision;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "target_longitude" double precision;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "start_radius_meters" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
UPDATE "work_orders"
SET
  "target_latitude" = "sites"."latitude",
  "target_longitude" = "sites"."longitude"
FROM "sites"
WHERE "work_orders"."site_id" = "sites"."id";
