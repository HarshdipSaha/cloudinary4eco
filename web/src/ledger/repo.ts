import { createHash } from "node:crypto";
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { Db } from "./db";
import * as t from "./schema";
import type { Decision, DecisionKind, ProjectType, Site } from "@/domain/types";
import { JEV_USD_PER_INPUT_TOKEN } from "@/domain/thresholds";

const toSite = (r: typeof t.sites.$inferSelect): Site => ({
  id: r.id, projectId: r.projectId, name: r.name, description: r.description,
  location: { lat: r.lat, lon: r.lon }, radiusM: r.radiusM, baselineAssetId: r.baselineAssetId, qrSlug: r.qrSlug,
});

export async function createProject(db: Db, p: { id: string; name: string; type: ProjectType }) {
  await db.insert(t.projects).values(p);
}
export async function project(db: Db, id: string) {
  return (await db.select().from(t.projects).where(eq(t.projects.id, id)))[0] ?? null;
}
export async function listProjects(db: Db) {
  return db.select().from(t.projects).orderBy(t.projects.createdAt);
}

export async function createSite(db: Db, s: Site) {
  await db.insert(t.sites).values({ id: s.id, projectId: s.projectId, name: s.name, description: s.description, lat: s.location.lat, lon: s.location.lon, radiusM: s.radiusM, baselineAssetId: s.baselineAssetId, qrSlug: s.qrSlug });
}
export async function site(db: Db, id: string) {
  const r = (await db.select().from(t.sites).where(eq(t.sites.id, id)))[0];
  return r ? toSite(r) : null;
}
export async function siteBySlug(db: Db, slug: string) {
  const r = (await db.select().from(t.sites).where(eq(t.sites.qrSlug, slug)))[0];
  return r ? toSite(r) : null;
}
export async function sitesForProject(db: Db, projectId: string) {
  return (await db.select().from(t.sites).where(eq(t.sites.projectId, projectId))).map(toSite);
}
export async function setBaseline(db: Db, siteId: string, assetId: string) {
  await db.update(t.sites).set({ baselineAssetId: assetId }).where(eq(t.sites.id, siteId));
  await db.insert(t.baselineHistory).values({ siteId, assetId });
}
export async function baselineHistory(db: Db, siteId: string) {
  return db.select().from(t.baselineHistory).where(eq(t.baselineHistory.siteId, siteId)).orderBy(desc(t.baselineHistory.setAt));
}

export async function createClaim(db: Db, c: typeof t.claims.$inferInsert) {
  await db.insert(t.claims).values(c);
}
export async function claimFor(db: Db, projectId: string, siteId: string | null) {
  const rows = await db.select().from(t.claims).where(eq(t.claims.projectId, projectId)).orderBy(desc(t.claims.periodEnd));
  return rows.find((c) => c.siteId === siteId) ?? rows.find((c) => c.siteId === null) ?? null;
}
export async function activeClaim(db: Db, projectId: string, siteId: string | null, day: string) {
  const rows = await db.select().from(t.claims).where(and(eq(t.claims.projectId, projectId), sql`${t.claims.periodStart} <= ${day}`, sql`${t.claims.periodEnd} >= ${day}`));
  return rows.find((c) => c.siteId === siteId) ?? rows.find((c) => c.siteId === null) ?? null;
}

export async function recordDecision(db: Db, d: Decision) {
  const stateHash = d.state === undefined ? null : createHash("sha256").update(JSON.stringify(d.state)).digest("hex");
  const [row] = await db.insert(t.decisions).values({
    kind: d.kind, subjectId: d.subjectId, status: "decided", question: (d.question ?? null) as any, state: (d.state ?? null) as any, stateHash,
    answer: d.answer as any, probabilities: d.probabilities,
    confidence: d.confidence, model: d.model, latencyMs: d.latencyMs, inputTokens: d.inputTokens,
  }).returning({ id: t.decisions.id });
  return row!.id;
}
export async function recordPending(db: Db, kind: DecisionKind, subjectId: string, reason: string) {
  const [row] = await db.insert(t.decisions).values({ kind, subjectId, status: "pending", reason }).returning({ id: t.decisions.id });
  return row!.id;
}
export async function decision(db: Db, id: number) {
  return (await db.select().from(t.decisions).where(eq(t.decisions.id, id)))[0] ?? null;
}
export async function decisionsFor(db: Db, subjectId: string) {
  return db.select().from(t.decisions).where(eq(t.decisions.subjectId, subjectId)).orderBy(desc(t.decisions.createdAt));
}

export type EvidenceInsert = typeof t.evidence.$inferInsert;
export async function upsertEvidence(db: Db, e: EvidenceInsert) {
  await db.insert(t.evidence).values(e).onConflictDoUpdate({ target: t.evidence.assetId, set: e });
}
export async function evidenceItem(db: Db, assetId: string) {
  return (await db.select().from(t.evidence).where(eq(t.evidence.assetId, assetId)))[0] ?? null;
}
export async function evidenceForBatch(db: Db, batchId: string) {
  return db.select().from(t.evidence).where(eq(t.evidence.batchId, batchId)).orderBy(t.evidence.createdAt);
}
export async function evidenceForSite(db: Db, siteId: string) {
  return db.select().from(t.evidence).where(eq(t.evidence.siteId, siteId)).orderBy(t.evidence.capturedAt);
}
export async function priorHashes(db: Db, projectId: string) {
  return (await db.select({ assetId: t.evidence.assetId, siteId: t.evidence.siteId, phash: t.evidence.phash, capturedAt: t.evidence.capturedAt, batchId: t.evidence.batchId })
    .from(t.evidence).where(and(eq(t.evidence.projectId, projectId), isNotNull(t.evidence.phash))))
    .map((r) => ({ assetId: r.assetId, siteId: r.siteId, phash: r.phash!, capturedAt: r.capturedAt ? r.capturedAt.toISOString() : null, batchId: r.batchId }));
}

export async function batchUsage(db: Db, batchId: string) {
  const ids = (await db.select({ id: t.evidence.assetId }).from(t.evidence).where(eq(t.evidence.batchId, batchId))).map((r) => r.id);
  if (!ids.length) return { inputTokens: 0, usd: 0, decisions: 0 };
  const [r] = await db.select({ tokens: sql<number>`coalesce(sum(${t.decisions.inputTokens}),0)::int`, n: sql<number>`count(*)::int` })
    .from(t.decisions).where(and(inArray(t.decisions.subjectId, ids), eq(t.decisions.status, "decided")));
  return { inputTokens: r!.tokens, usd: r!.tokens * JEV_USD_PER_INPUT_TOKEN, decisions: r!.n };
}

export async function insertDerivative(db: Db, d: typeof t.derivatives.$inferInsert) {
  const [row] = await db.insert(t.derivatives).values(d).returning({ id: t.derivatives.id });
  return row!.id;
}
export async function derivative(db: Db, id: number) {
  return (await db.select().from(t.derivatives).where(eq(t.derivatives.id, id)))[0] ?? null;
}
export async function derivativeFor(db: Db, sourceAssetId: string) {
  return (await db.select().from(t.derivatives).where(eq(t.derivatives.sourceAssetId, sourceAssetId)).orderBy(desc(t.derivatives.createdAt)))[0] ?? null;
}

export async function insertAssessment(db: Db, a: typeof t.assessments.$inferInsert) {
  const [row] = await db.insert(t.assessments).values(a).returning({ id: t.assessments.id });
  return row!.id;
}
export async function assessmentsForSite(db: Db, siteId: string) {
  return db.select().from(t.assessments).where(eq(t.assessments.siteId, siteId)).orderBy(t.assessments.timepoint, t.assessments.createdAt, t.assessments.id);
}
export async function insertAgreement(db: Db, a: typeof t.agreements.$inferInsert) {
  await db.insert(t.agreements).values(a);
}
export async function latestAgreement(db: Db, siteId: string) {
  return (await db.select().from(t.agreements).where(eq(t.agreements.siteId, siteId)).orderBy(desc(t.agreements.createdAt), desc(t.agreements.id)))[0] ?? null;
}
export async function recordOverride(db: Db, o: typeof t.overrides.$inferInsert) {
  await db.insert(t.overrides).values(o);
}

export async function insertReport(db: Db, r: typeof t.reports.$inferInsert) {
  await db.insert(t.reports).values(r);
}
export async function insertSentences(db: Db, rows: (typeof t.reportSentences.$inferInsert)[]) {
  if (rows.length) await db.insert(t.reportSentences).values(rows);
}
export async function report(db: Db, id: string) {
  return (await db.select().from(t.reports).where(eq(t.reports.id, id)))[0] ?? null;
}
export async function reportBySlug(db: Db, slug: string) {
  return (await db.select().from(t.reports).where(eq(t.reports.publicSlug, slug)))[0] ?? null;
}
export async function reportsForProject(db: Db, projectId: string) {
  return db.select().from(t.reports).where(eq(t.reports.projectId, projectId)).orderBy(desc(t.reports.createdAt));
}
export async function sentencesFor(db: Db, reportId: string) {
  return db.select().from(t.reportSentences).where(eq(t.reportSentences.reportId, reportId)).orderBy(t.reportSentences.ordinal);
}
export async function evidenceByIds(db: Db, ids: string[]) {
  return ids.length ? db.select().from(t.evidence).where(inArray(t.evidence.assetId, ids)) : [];
}
export async function agreementsForSite(db: Db, siteId: string) {
  return db.select().from(t.agreements).where(eq(t.agreements.siteId, siteId)).orderBy(desc(t.agreements.createdAt));
}

export async function siteChart(db: Db, siteId: string) {
  const s = await site(db, siteId);
  if (!s) return { site: null, baseline: null, timepoints: [], counts: {} as Record<string, number>, agreement: null, project: null };
  const proj = await project(db, s.projectId);
  const baseline = s.baselineAssetId ? await evidenceItem(db, s.baselineAssetId) : null;
  const items = await evidenceForSite(db, siteId);
  const byDay = new Map<string, Awaited<ReturnType<typeof assessmentsForSite>>[number]>();
  for (const a of await assessmentsForSite(db, siteId)) byDay.set(a.timepoint, a); // oldest→newest, so the last per day wins
  const timepoints = [];
  for (const [timepoint, a] of [...byDay].sort(([x], [y]) => x.localeCompare(y))) {
    const der = a.derivativeId ? await derivative(db, a.derivativeId) : null;
    const dec = a.decisionId ? await decision(db, a.decisionId) : null;
    const source = der ? items.find((e) => e.assetId === der.sourceAssetId) ?? null : null;
    timepoints.push({ timepoint, grade: a.grade, status: a.status, derivative: der, decision: dec, source, photos: items.filter((e) => e.timepoint === timepoint) });
  }
  const counts = items.reduce<Record<string, number>>((m, e) => ({ ...m, [e.status]: (m[e.status] ?? 0) + 1 }), { accepted: 0, needs_review: 0, set_aside: 0, pending: 0 });
  return { site: s, project: proj, baseline, timepoints, counts, agreement: await latestAgreement(db, siteId) };
}


