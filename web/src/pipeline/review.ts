import * as repo from "@/ledger/repo";
import { ingestBatch, type PipelineDeps } from "./ingest";

export async function applyReview(
  deps: PipelineDeps,
  r: { assetId: string; action: "accept" | "set_aside" | "assign_site"; siteId?: string; reason: string; actor: string }
) {
  if (!r.reason.trim()) throw new Error("A reason is required for every review action");
  const e = await repo.evidenceItem(deps.db, r.assetId);
  if (!e) throw new Error(`Unknown asset ${r.assetId}`);
  if (r.action === "assign_site") {
    if (!r.siteId) throw new Error("siteId required");
    await repo.recordOverride(deps.db, {
      subjectId: r.assetId,
      field: "site_id",
      fromValue: e.siteId,
      toValue: r.siteId,
      reason: r.reason,
      actor: r.actor,
    });
    await ingestBatch(deps, {
      projectId: e.projectId,
      source: e.source as never,
      assetIds: [r.assetId],
      batchId: `review-${Date.now()}`,
      siteId: r.siteId,
      meta: {
        [r.assetId]: {
          filename: e.filename ?? undefined,
          sender: e.sender ?? undefined,
          comment: e.comment ?? undefined,
          sentAt: e.capturedAt?.toISOString(),
        },
      },
    });
    return;
  }
  const status = r.action === "accept" ? "accepted" : "set_aside";
  await repo.recordOverride(deps.db, {
    subjectId: r.assetId,
    field: "status",
    fromValue: e.status,
    toValue: status,
    reason: r.reason,
    actor: r.actor,
  });
  await repo.upsertEvidence(deps.db, { ...e, status, statusReason: `Reviewer: ${r.reason}` });
}

export async function signReading(
  deps: PipelineDeps,
  s: { siteId: string; timepoint: string; grade: number; reason?: string; actor: string }
) {
  const last = (await repo.assessmentsForSite(deps.db, s.siteId)).filter((a) => a.timepoint === s.timepoint).at(-1);
  if (last && last.grade !== s.grade && !s.reason?.trim()) throw new Error("Changing the model's grade requires a reason");
  await repo.recordOverride(deps.db, {
    subjectId: `${s.siteId}@${s.timepoint}`,
    field: "src_grade",
    fromValue: last?.grade ?? null,
    toValue: s.grade,
    reason: s.reason?.trim() || "Confirmed",
    actor: s.actor,
  });
  await repo.insertAssessment(deps.db, {
    siteId: s.siteId,
    timepoint: s.timepoint,
    derivativeId: last?.derivativeId ?? null,
    decisionId: last?.decisionId ?? null,
    grade: s.grade,
    status: "signed",
  });
}
