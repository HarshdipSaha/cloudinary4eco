import type { Decision, Flag, Relevance, RegistrationResult } from "@/domain/types";
import { decideStatus } from "@/domain/status";
import * as repo from "@/ledger/repo";
import type { PipelineDeps } from "./ingest";
import { assessSite } from "./assess";
import { updateAgreement } from "./agreement";

export const ALIGNMENT_PENDING_REASON = "Alignment pending: CV worker unavailable";

export class AlignmentRetryConflict extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlignmentRetryConflict";
  }
}

function storedDecision<T>(row: Awaited<ReturnType<typeof repo.decisionsFor>>[number]): Decision<T> | null {
  if (row.status !== "decided" || row.answer === null || row.confidence === null) return null;
  return {
    kind: row.kind as Decision["kind"],
    subjectId: row.subjectId,
    question: row.question ?? undefined,
    state: row.state ?? undefined,
    answer: row.answer as T,
    probabilities: row.probabilities ?? {},
    confidence: row.confidence,
    model: row.model ?? "unknown",
    latencyMs: row.latencyMs ?? 0,
    inputTokens: row.inputTokens ?? 0,
  };
}

function registrationFromDerivative(derivative: NonNullable<Awaited<ReturnType<typeof repo.derivativeFor>>>): RegistrationResult {
  const metrics = derivative.metrics;
  const metricKeys = [
    "vegetationFractionBefore",
    "vegetationFractionAfter",
    "vegetationDelta",
    "changedAreaFraction",
    "brightnessShift",
  ] as const;
  const completeMetrics = metrics && metricKeys.every((key) => Number.isFinite(metrics[key]))
    ? {
        vegetationFractionBefore: metrics.vegetationFractionBefore!,
        vegetationFractionAfter: metrics.vegetationFractionAfter!,
        vegetationDelta: metrics.vegetationDelta!,
        changedAreaFraction: metrics.changedAreaFraction!,
        brightnessShift: metrics.brightnessShift!,
      }
    : null;
  return {
    quality: derivative.quality as RegistrationResult["quality"],
    inliers: derivative.inliers,
    inlierRatio: derivative.inlierRatio,
    homography: derivative.homography,
    alignedAssetId: derivative.alignedAssetId,
    differenceAssetId: derivative.differenceAssetId,
    inlierPoints: derivative.inlierPoints,
    metrics: completeMetrics,
  };
}

async function assessIfNeeded(deps: PipelineDeps, siteId: string, assetId: string, timepoint: string | null, quality: RegistrationResult["quality"], status: string) {
  if (!timepoint || quality === "failed" || status === "set_aside") return;
  const derivative = await repo.derivativeFor(deps.db, assetId);
  if (!derivative) return;
  const assessments = await repo.assessmentsForSite(deps.db, siteId);
  if (assessments.some((assessment) => assessment.timepoint === timepoint && assessment.derivativeId === derivative.id)) return;
  await assessSite(deps, siteId, timepoint);
  await updateAgreement(deps, siteId, timepoint);
}

/**
 * Retry the CV part of a pending evidence item without uploading or asking Jev to
 * repeat its triage. If an earlier request stored its derivative but lost its
 * response, reuse that derivative and finish writing the evidence state.
 */
export async function retryPendingAlignment(deps: PipelineDeps, siteId: string, assetId: string) {
  const { db, media, registration } = deps;
  const [site, evidence] = await Promise.all([repo.site(db, siteId), repo.evidenceItem(db, assetId)]);
  if (!site) throw new Error("Unknown site");
  if (!evidence) throw new Error("Evidence not found");
  if (evidence.siteId !== siteId) throw new AlignmentRetryConflict("Evidence is not assigned to this site");
  if (evidence.projectId !== site.projectId) throw new AlignmentRetryConflict("Evidence and site belong to different projects");

  const existingDerivative = await repo.derivativeFor(db, assetId);
  const alreadyResolved = evidence.status !== "pending" || evidence.statusReason !== ALIGNMENT_PENDING_REASON;
  if (alreadyResolved) {
    if (existingDerivative?.siteId === siteId && existingDerivative.baselineAssetId === site.baselineAssetId) {
      await assessIfNeeded(deps, siteId, assetId, evidence.timepoint, existingDerivative.quality as RegistrationResult["quality"], evidence.status);
      return { assetId, siteId, status: evidence.status, statusReason: evidence.statusReason, alreadyResolved: true };
    }
    throw new AlignmentRetryConflict("Evidence is not awaiting CV alignment");
  }

  const baselineAssetId = site.baselineAssetId;
  if (!baselineAssetId || baselineAssetId === assetId) {
    throw new AlignmentRetryConflict("This site needs a different baseline photo before alignment can be retried");
  }
  const baseline = await repo.evidenceItem(db, baselineAssetId);
  if (!baseline || baseline.projectId !== evidence.projectId) {
    throw new AlignmentRetryConflict("The site baseline photo is unavailable");
  }

  const records = await repo.decisionsFor(db, assetId);
  const relevanceRow = records.find((row) => row.kind === "triage_relevance");
  const relevance = relevanceRow && storedDecision<Relevance>(relevanceRow);
  if (!relevance || relevance.answer !== "evidence") {
    throw new AlignmentRetryConflict("The stored triage decision does not allow vegetation alignment");
  }
  const siteRow = records.find((row) => row.kind === "triage_site");
  const siteDecision = siteRow ? storedDecision<string>(siteRow) : null;
  const flags = (evidence.flags ?? []) as Flag[];
  const registrationRecord = existingDerivative
    && existingDerivative.siteId === siteId
    && existingDerivative.baselineAssetId === baselineAssetId
    ? registrationFromDerivative(existingDerivative)
    : await registration.register({
        siteId,
        baselineAssetId,
        baselineUrl: baseline.secureUrl,
        followupAssetId: assetId,
        followupUrl: evidence.secureUrl,
      });

  if (!(existingDerivative?.siteId === siteId && existingDerivative.baselineAssetId === baselineAssetId)) {
    await repo.insertDerivative(db, {
      sourceAssetId: assetId,
      baselineAssetId,
      siteId,
      quality: registrationRecord.quality,
      inliers: registrationRecord.inliers,
      inlierRatio: registrationRecord.inlierRatio,
      homography: registrationRecord.homography,
      alignedAssetId: registrationRecord.alignedAssetId,
      differenceAssetId: registrationRecord.differenceAssetId,
      inlierPoints: registrationRecord.inlierPoints,
      metrics: registrationRecord.metrics as Record<string, number> | null,
    });
  }

  const nextFlags = flags.filter((flag) => flag.kind !== "possible_different_location");
  if (registrationRecord.quality === "failed") {
    nextFlags.push({
      kind: "possible_different_location",
      detail: `Could not align to the ${site.name} baseline (${registrationRecord.inliers} matching points).`,
      relatedAssetIds: [baseline.assetId],
    });
  }
  const decision = decideStatus({
    relevance,
    site: siteDecision,
    siteId,
    flags: nextFlags,
    registration: registrationRecord,
  });
  await repo.upsertEvidence(db, {
    ...evidence,
    status: decision.status,
    statusReason: decision.reason,
    flags: nextFlags,
  });

  try {
    await media.setContext(assetId, { project_id: evidence.projectId, site_id: siteId, status: decision.status });
  } catch {
    // Cloudinary context mirrors the ledger and must not undo a completed retry.
  }

  await assessIfNeeded(deps, siteId, assetId, evidence.timepoint, registrationRecord.quality, decision.status);

  return { assetId, siteId, status: decision.status, statusReason: decision.reason, alreadyResolved: false };
}
