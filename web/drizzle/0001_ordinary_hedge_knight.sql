CREATE TABLE "public_video_imports" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"site_id" text NOT NULL,
	"source_url" text NOT NULL,
	"permission_note" text NOT NULL,
	"remote_video_asset_id" text NOT NULL,
	"duration_seconds" double precision NOT NULL,
	"status" text NOT NULL,
	"status_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "video_import_id" text;--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "frame_second" double precision;--> statement-breakpoint
ALTER TABLE "public_video_imports" ADD CONSTRAINT "public_video_imports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_video_imports" ADD CONSTRAINT "public_video_imports_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_video_import_id_public_video_imports_id_fk" FOREIGN KEY ("video_import_id") REFERENCES "public"."public_video_imports"("id") ON DELETE no action ON UPDATE no action;