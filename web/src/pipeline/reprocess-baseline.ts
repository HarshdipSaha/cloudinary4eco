import type { EvidenceSource } from "@/domain/types";
import * as repo from "@/ledger/repo";
import { ingestBatch, type PipelineDeps } from "./ingest";

/** Re-runs already assigned follow-ups once a site receives its first baseline. */
export async function reprocessEvidenceAfterBaseline(deps: PipelineDeps, siteId: string) {
  const site = await repo.site(deps.db, siteId);
  if (!site?.baselineAssetId) return { reprocessed: 0 };

  const followups = (await repo.evidenceForSite(deps.db, siteId)).filter(
    (e) => e.assetId !== site.baselineAssetId && e.status !== "set_aside"
  );

  for (const evidence of followups) {
    await ingestBatch(deps, {
      projectId: site.projectId,
      source: evidence.source as EvidenceSource,
      assetIds: [evidence.assetId],
      batchId: `baseline-reprocess-${siteId}-${Date.now()}`,
      siteId,
      meta: {
        [evidence.assetId]: {
          filename: evidence.filename ?? undefined,
          sender: evidence.sender ?? undefined,
          comment: evidence.comment ?? undefined,
          sentAt: evidence.capturedAt?.toISOString(),
        },
      },
    });
  }

  return { reprocessed: followups.length };
}
