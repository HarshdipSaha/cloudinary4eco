CREATE TABLE "video_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"import_id" text NOT NULL,
	"frame_asset_ids" jsonb NOT NULL,
	"image_url" text NOT NULL,
	"facts" jsonb NOT NULL,
	"sentences" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_campaigns" ADD CONSTRAINT "video_campaigns_import_id_public_video_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."public_video_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_campaigns_import" ON "video_campaigns" USING btree ("import_id");