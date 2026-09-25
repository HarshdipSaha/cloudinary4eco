CREATE TABLE "agreements" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"claim_id" text NOT NULL,
	"decision_id" integer,
	"result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"timepoint" text NOT NULL,
	"derivative_id" integer,
	"decision_id" integer,
	"grade" integer,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "baseline_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"set_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"site_id" text,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"subject_id" text NOT NULL,
	"status" text NOT NULL,
	"question" jsonb,
	"state" jsonb,
	"state_hash" text,
	"answer" jsonb,
	"probabilities" jsonb,
	"confidence" double precision,
	"model" text,
	"latency_ms" integer,
	"input_tokens" integer,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "derivatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_asset_id" text NOT NULL,
	"baseline_asset_id" text NOT NULL,
	"site_id" text NOT NULL,
	"quality" text NOT NULL,
	"inliers" integer NOT NULL,
	"inlier_ratio" double precision NOT NULL,
	"homography" jsonb,
	"aligned_asset_id" text,
	"difference_asset_id" text,
	"inlier_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metrics" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"asset_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"site_id" text,
	"batch_id" text,
	"source" text NOT NULL,
	"status" text NOT NULL,
	"status_reason" text,
	"secure_url" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"caption" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ocr_text" text,
	"captured_at" timestamp with time zone,
	"timepoint" text,
	"lat" double precision,
	"lon" double precision,
	"phash" text,
	"face_count" integer,
	"missing_signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"filename" text,
	"sender" text,
	"comment" text,
	"relevance" text,
	"activity" text,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" text NOT NULL,
	"field" text NOT NULL,
	"from_value" jsonb,
	"to_value" jsonb,
	"reason" text NOT NULL,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_sentences" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"section" text NOT NULL,
	"ordinal" integer NOT NULL,
	"text" text NOT NULL,
	"fact_ids" jsonb NOT NULL,
	"decision_id" integer,
	"support" double precision,
	"status" text NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"public_slug" text NOT NULL,
	"draft" text NOT NULL,
	"facts" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"lat" double precision NOT NULL,
	"lon" double precision NOT NULL,
	"radius_m" integer NOT NULL,
	"baseline_asset_id" text,
	"qr_slug" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_derivative_id_derivatives_id_fk" FOREIGN KEY ("derivative_id") REFERENCES "public"."derivatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseline_history" ADD CONSTRAINT "baseline_history_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "derivatives" ADD CONSTRAINT "derivatives_source_asset_id_evidence_asset_id_fk" FOREIGN KEY ("source_asset_id") REFERENCES "public"."evidence"("asset_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "derivatives" ADD CONSTRAINT "derivatives_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_sentences" ADD CONSTRAINT "report_sentences_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_sentences" ADD CONSTRAINT "report_sentences_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "decisions_subject" ON "decisions" USING btree ("subject_id","kind");--> statement-breakpoint
CREATE INDEX "evidence_site" ON "evidence" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "evidence_batch" ON "evidence" USING btree ("batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sites_qr_slug" ON "sites" USING btree ("qr_slug");