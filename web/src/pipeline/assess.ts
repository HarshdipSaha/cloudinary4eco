import * as repo from "@/ledger/repo";
import type { ProjectType, RegistrationQuality } from "@/domain/types";
import { DecisionsUnavailable } from "@/ports/decisions";
import { THRESHOLDS } from "@/domain/thresholds";
import { daysBetween } from "@/domain/timepoint";
import type { PipelineDeps } from "./ingest";

export async function assessSite(deps: PipelineDeps, siteId: string, timepoint: string) {
  const { db, decisions } = deps;
  const site = await repo.site(db, siteId);
  if (!site?.baselineAssetId) return null;
  const project = await repo.project(db, site.projectId);
  const baseline = await repo.evidenceItem(db, site.baselineAssetId);
  const rows = (await repo.evidenceForSite(db, siteId)).filter(
    (e) => e.timepoint === timepoint && e.status !== "set_aside" && e.assetId !== site.baselineAssetId
  );

  let best: { row: (typeof rows)[number]; der: NonNullable<Awaited<ReturnType<typeof repo.derivativeFor>>> } | null = null;
  for (const row of rows) {
    const der = await repo.derivativeFor(db, row.assetId);
    if (!der || der.quality === "failed") continue;
    const rank = (q: string) => (q === "good" ? 2 : 1);
    if (!best || rank(der.quality) > rank(best.der.quality) || (rank(der.quality) === rank(best.der.quality) && der.inliers > best.der.inliers)) {
      best = { row, der };
    }
  }
  if (!best || !project || !baseline) return null;

  const m = best.der.metrics;
  try {
    const d = await decisions.gradeSite({
      siteId,
      timepoint,
      projectType: project.type as ProjectType,
      baselineCaption: baseline.caption,
      followupCaption: best.row.caption,
      metrics: m
        ? {
            vegetationFractionBefore: m.vegetationFractionBefore!,
            vegetationFractionAfter: m.vegetationFractionAfter!,
            vegetationDelta: m.vegetationDelta!,
            changedAreaFraction: m.changedAreaFraction!,
            brightnessShift: m.brightnessShift!,
          }
        : null,
      registrationQuality: best.der.quality as RegistrationQuality,
      daysSinceBaseline:
        baseline.capturedAt && best.row.capturedAt ? daysBetween(baseline.capturedAt.toISOString(), best.row.capturedAt.toISOString()) : 0,
    });
    const decisionId = await repo.recordDecision(db, d);
    const top = d.probabilities[String(d.answer)] ?? d.confidence;
    const status = top >= THRESHOLDS.srcAccept && best.der.quality === "good" ? "accepted" : "needs_review";
    await repo.insertAssessment(db, { siteId, timepoint, derivativeId: best.der.id, decisionId, grade: d.answer, status });
    return { grade: d.answer, status };
  } catch (e) {
    if (!(e instanceof DecisionsUnavailable)) throw e;
    const decisionId = await repo.recordPending(db, "src_grade", `${siteId}@${timepoint}`, e.message);
    await repo.insertAssessment(db, { siteId, timepoint, derivativeId: best.der.id, decisionId, grade: null, status: "pending" });
    return { grade: null, status: "pending" };
  }
}
