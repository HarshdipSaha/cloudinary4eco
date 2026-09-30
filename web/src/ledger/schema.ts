import type { CampaignSentence } from "../domain/types";
import { pgTable, text, integer, doublePrecision, jsonb, timestamp, serial, uniqueIndex, index } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sites = pgTable("sites", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  radiusM: integer("radius_m").notNull(),
  baselineAssetId: text("baseline_asset_id"),
  qrSlug: text("qr_slug").notNull(),
}, (t) => [uniqueIndex("sites_qr_slug").on(t.qrSlug)]);

export const baselineHistory = pgTable("baseline_history", {
  id: serial("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  assetId: text("asset_id").notNull(),
  setAt: timestamp("set_at", { withTimezone: true }).defaultNow().notNull(),
});

export const claims = pgTable("claims", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  siteId: text("site_id").references(() => sites.id),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  text: text("text").notNull(),
});

export const publicVideoImports = pgTable("public_video_imports", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  siteId: text("site_id").notNull().references(() => sites.id),
  sourceUrl: text("source_url").notNull(),
  permissionNote: text("permission_note").notNull(),
  remoteVideoAssetId: text("remote_video_asset_id").notNull(),
  durationSeconds: doublePrecision("duration_seconds").notNull(),
  status: text("status").notNull(),
  statusReason: text("status_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const videoCampaigns = pgTable("video_campaigns", {
  id: text("id").primaryKey(),
  importId: text("import_id").notNull().references(() => publicVideoImports.id),
  frameAssetIds: jsonb("frame_asset_ids").$type<string[]>().notNull(),
  imageUrl: text("image_url").notNull(),
  facts: jsonb("facts").$type<{ id: string; text: string; evidenceIds: string[] }[]>().notNull(),
  sentences: jsonb("sentences").$type<CampaignSentence[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("video_campaigns_import").on(t.importId)]);

export const evidence = pgTable("evidence", {
  assetId: text("asset_id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  siteId: text("site_id").references(() => sites.id),
  videoImportId: text("video_import_id").references(() => publicVideoImports.id),
  frameSecond: doublePrecision("frame_second"),
  batchId: text("batch_id"),
  source: text("source").notNull(),
  status: text("status").notNull(),
  statusReason: text("status_reason"),
  secureUrl: text("secure_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  caption: text("caption"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  ocrText: text("ocr_text"),
  capturedAt: timestamp("captured_at", { withTimezone: true }),
  timepoint: text("timepoint"),
  lat: doublePrecision("lat"),
  lon: doublePrecision("lon"),
  phash: text("phash"),
  faceCount: integer("face_count"),
  missingSignals: jsonb("missing_signals").$type<string[]>().notNull().default([]),
  filename: text("filename"),
  sender: text("sender"),
  comment: text("comment"),
  relevance: text("relevance"),
  activity: text("activity"),
  flags: jsonb("flags").$type<{ kind: string; detail: string; relatedAssetIds: string[] }[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("evidence_site").on(t.siteId), index("evidence_batch").on(t.batchId)]);

export const derivatives = pgTable("derivatives", {
  id: serial("id").primaryKey(),
  sourceAssetId: text("source_asset_id").notNull().references(() => evidence.assetId),
  baselineAssetId: text("baseline_asset_id").notNull(),
  siteId: text("site_id").notNull().references(() => sites.id),
  quality: text("quality").notNull(),
  inliers: integer("inliers").notNull(),
  inlierRatio: doublePrecision("inlier_ratio").notNull(),
  homography: jsonb("homography").$type<number[] | null>(),
  alignedAssetId: text("aligned_asset_id"),
  differenceAssetId: text("difference_asset_id"),
  inlierPoints: jsonb("inlier_points").$type<[number, number][]>().notNull().default([]),
  metrics: jsonb("metrics").$type<Record<string, number> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const decisions = pgTable("decisions", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  subjectId: text("subject_id").notNull(),
  status: text("status").notNull(), // decided | pending
  question: jsonb("question"),
  state: jsonb("state"),
  stateHash: text("state_hash"),
  answer: jsonb("answer"),
  probabilities: jsonb("probabilities").$type<Record<string, number>>(),
  confidence: doublePrecision("confidence"),
  model: text("model"),
  latencyMs: integer("latency_ms"),
  inputTokens: integer("input_tokens"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("decisions_subject").on(t.subjectId, t.kind)]);

export const overrides = pgTable("overrides", {
  id: serial("id").primaryKey(),
  subjectId: text("subject_id").notNull(),
  field: text("field").notNull(),
  fromValue: jsonb("from_value"),
  toValue: jsonb("to_value"),
  reason: text("reason").notNull(),
  actor: text("actor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  timepoint: text("timepoint").notNull(),
  derivativeId: integer("derivative_id").references(() => derivatives.id),
  decisionId: integer("decision_id").references(() => decisions.id),
  grade: integer("grade"),
  status: text("status").notNull(), // accepted | needs_review | pending | signed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const agreements = pgTable("agreements", {
  id: serial("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  claimId: text("claim_id").notNull().references(() => claims.id),
  decisionId: integer("decision_id").references(() => decisions.id),
  result: text("result"), // corroborates | contradicts | insufficient | null when pending
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  publicSlug: text("public_slug").notNull(),
  draft: text("draft").notNull(),
  facts: jsonb("facts").$type<{ id: string; text: string; evidenceIds: string[] }[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reportSentences = pgTable("report_sentences", {
  id: serial("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => reports.id),
  section: text("section").notNull(), // findings | impression
  ordinal: integer("ordinal").notNull(),
  text: text("text").notNull(),
  factIds: jsonb("fact_ids").$type<string[]>().notNull(),
  decisionId: integer("decision_id").references(() => decisions.id),
  support: doublePrecision("support"),
  status: text("status").notNull(), // kept | struck | pending
  reason: text("reason"),
});
