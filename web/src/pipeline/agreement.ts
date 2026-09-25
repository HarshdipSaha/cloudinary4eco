import * as repo from "@/ledger/repo";
import { DecisionsUnavailable } from "@/ports/decisions";
import { gradeLabel } from "@/domain/src-rubrics";
import type { ProjectType } from "@/domain/types";
import type { PipelineDeps } from "./ingest";

export async function updateAgreement(deps: PipelineDeps, siteId: string, day: string) {
  const { db, decisions } = deps;
  const site = await repo.site(db, siteId);
  if (!site) return null;
  const claim = await repo.activeClaim(db, site.projectId, siteId, day);
  if (!claim) return null;
  const rows = (await repo.evidenceForSite(db, siteId)).filter(
    (e) => e.status !== "set_aside" && e.timepoint !== null && e.timepoint >= claim.periodStart && e.timepoint <= claim.periodEnd
  );
  const witness = rows.filter((e) => e.source === "witness");
  if (!witness.length) return null;
  const implementer = rows.filter((e) => e.source !== "witness");
  const summary = (e: (typeof rows)[number]) => `${e.timepoint}: ${e.caption ?? "no caption"}${e.comment ? ` (comment: ${e.comment})` : ""}`;
  const project = await repo.project(db, site.projectId);
  const lastGrade = (await repo.assessmentsForSite(db, siteId)).filter((a) => a.grade !== null).at(-1);
  const implementerSummary = implementer.slice(-10).map(summary);
  if (lastGrade && project) {
    implementerSummary.push(`Latest Site Response grade (${lastGrade.timepoint}): ${gradeLabel(project.type as ProjectType, lastGrade.grade!)}`);
  }

  try {
    const d = await decisions.witnessAgreement({
      siteId,
      claimText: claim.text,
      implementerSummary,
      witnessSummary: witness.slice(-10).map(summary),
    });
    const decisionId = await repo.recordDecision(db, d);
    await repo.insertAgreement(db, { siteId, claimId: claim.id, decisionId, result: d.answer });
    return d.answer;
  } catch (e) {
    if (!(e instanceof DecisionsUnavailable)) throw e;
    const decisionId = await repo.recordPending(db, "witness_agreement", siteId, e.message);
    await repo.insertAgreement(db, { siteId, claimId: claim.id, decisionId, result: null });
    return null;
  }
}
