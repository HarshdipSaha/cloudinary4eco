import type { Db } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import type { Fact } from "@/ports/drafter";
import { gradeLabel } from "@/domain/src-rubrics";
import { INTEGRITY_FLAGS, type ProjectType } from "@/domain/types";

const pct = (n: number) => `${Math.round(n * 100)}%`;

export async function buildDigest(db: Db, projectId: string, start: string, end: string): Promise<Fact[]> {
  const project = await repo.project(db, projectId);
  if (!project) throw new Error(`Unknown project ${projectId}`);
  const type = project.type as ProjectType;
  const facts: Omit<Fact, "id">[] = [];

  for (const site of await repo.sitesForProject(db, projectId)) {
    const rows = (await repo.evidenceForSite(db, site.id)).filter((e) => e.timepoint && e.timepoint >= start && e.timepoint <= end);
    const baseline = site.baselineAssetId ? await repo.evidenceItem(db, site.baselineAssetId) : null;
    if (baseline?.timepoint) {
      facts.push({ text: `${site.name}: baseline photo taken ${baseline.timepoint}.`, evidenceIds: [baseline.assetId] });
    }

    const graded = (await repo.assessmentsForSite(db, site.id)).filter((a) => a.grade !== null && a.timepoint >= start && a.timepoint <= end).at(-1);
    if (graded) {
      const d = graded.decisionId ? await repo.decision(db, graded.decisionId) : null;
      const der = graded.derivativeId ? await repo.derivative(db, graded.derivativeId) : null;
      const p = d?.probabilities?.[String(graded.grade)];
      const src = der?.sourceAssetId ?? null;
      const ids = [src, der?.alignedAssetId].filter(Boolean) as string[];
      facts.push({
        text: `${site.name}: Site Response grade on ${graded.timepoint} is "${gradeLabel(type, graded.grade!)}"${p !== undefined ? ` (probability ${pct(p)})` : ""}${graded.status === "needs_review" ? ", awaiting human review" : graded.status === "signed" ? ", signed by a reviewer" : ""}.`,
        evidenceIds: ids,
      });
      const m = der?.metrics as Record<string, number> | null | undefined;
      if (m) {
        facts.push({
          text: `${site.name}: between baseline and ${graded.timepoint}, measured vegetation cover changed from ${pct(m.vegetationFractionBefore!)} to ${pct(m.vegetationFractionAfter!)} and ${pct(m.changedAreaFraction!)} of the aligned view changed (registration ${der!.quality}).`,
          evidenceIds: ids,
        });
      }
    }

    const accepted = rows.filter((e) => e.status === "accepted");
    const witnesses = accepted.filter((e) => e.source === "witness");
    const review = rows.filter((e) => e.status === "needs_review");
    if (rows.length) {
      facts.push({
        text: `${site.name}: ${accepted.length} photos accepted in the period, ${witnesses.length} of them from community witnesses; ${review.length} awaiting review.`,
        evidenceIds: accepted.slice(0, 12).map((e) => e.assetId),
      });
    }

    const agreement = await repo.latestAgreement(db, site.id);
    if (agreement?.result) {
      const claim = (await repo.activeClaim(db, projectId, site.id, end)) ?? null;
      facts.push({
        text: `${site.name}: community witness evidence ${agreement.result === "insufficient" ? "is insufficient to judge" : agreement.result} the claim "${claim?.text ?? "for this period"}".`,
        evidenceIds: witnesses.slice(0, 6).map((e) => e.assetId),
      });
    }

    const flagged = rows.filter((e) => e.flags.some((f) => INTEGRITY_FLAGS.includes(f.kind as never)));
    if (flagged.length) {
      const kinds = [...new Set(flagged.flatMap((e) => e.flags.map((f) => f.kind)).filter((k) => INTEGRITY_FLAGS.includes(k as never)))];
      facts.push({
        text: `${site.name}: ${flagged.length} photos were flagged for integrity checks (${kinds.join(", ").replaceAll("_", " ")}).`,
        evidenceIds: flagged.map((e) => e.assetId),
      });
    }
    const pending = rows.filter((e) => e.status === "pending");
    if (pending.length) {
      facts.push({
        text: `${site.name}: ${pending.length} photos are still pending because a service was unavailable.`,
        evidenceIds: pending.map((e) => e.assetId),
      });
    }
  }
  return facts.map((f, i) => ({ id: `F${i + 1}`, ...f }));
}
