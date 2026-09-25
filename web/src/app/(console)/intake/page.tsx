import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { IntakeClient } from "@/ui/intake/IntakeClient";
import type { IntakeRow } from "@/ui/intake/useIntake";
import type { Flag } from "@/domain/types";

export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const db = await getDb();
  const projects = await repo.listProjects(db);
  const projectId = projects[0]?.id ?? "yamuna-green";
  const sites = await repo.sitesForProject(db, projectId);
  const siteMap = new Map(sites.map((s) => [s.id, s.name]));

  const rawEvidence = await repo.evidenceForProject(db, projectId, 200);

  const initialRows: IntakeRow[] = rawEvidence.map((e) => ({
    localId: e.assetId,
    name: e.filename ?? e.assetId,
    objectUrl: e.secureUrl,
    thumbUrl: e.secureUrl,
    state: "decided",
    progress: 100,
    assetId: e.assetId,
    siteId: e.siteId,
    siteName: e.siteId ? siteMap.get(e.siteId) ?? e.siteId : null,
    relevance: e.relevance ?? undefined,
    activity: e.activity ?? undefined,
    status: e.status,
    statusReason: e.statusReason,
    flags: (e.flags ?? []) as Flag[],
    sender: e.sender ?? undefined,
    sentAt: e.capturedAt ? e.capturedAt.toISOString() : undefined,
    comment: e.comment ?? undefined,
  }));

  return (
    <div className="flex h-full flex-col">
      <IntakeClient projectId={projectId} initialRows={initialRows} />
    </div>
  );
}
