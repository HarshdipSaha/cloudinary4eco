import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { IntakeClient } from "@/ui/intake/IntakeClient";
import type { IntakeRow } from "@/ui/intake/useIntake";
import type { Flag } from "@/domain/types";

export const dynamic = "force-dynamic";

export default async function IntakePage(props: {
  searchParams: Promise<{ siteId?: string; assetId?: string }>;
}) {
  const query = await props.searchParams;
  const db = await getDb();
  const projects = await repo.listProjects(db);
  const requestedSite = query.siteId ? await repo.site(db, query.siteId) : null;
  const projectId = requestedSite && projects.some((p) => p.id === requestedSite.projectId)
    ? requestedSite.projectId
    : projects[0]?.id ?? "yamuna-green";
  const sites = await repo.sitesForProject(db, projectId);
  const siteId = sites.some((s) => s.id === query.siteId) ? query.siteId : undefined;
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
      <IntakeClient
        projectId={projectId}
        siteId={siteId}
        deepLinkAssetId={query.assetId}
        initialRows={initialRows}
      />
    </div>
  );
}
