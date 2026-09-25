import { eq } from "drizzle-orm";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import * as schema from "@/ledger/schema";
import { SetupClient } from "@/ui/setup/SetupClient";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const db = await getDb();
  const projects = await repo.listProjects(db);
  const currentProjectId = projects[0]?.id ?? "yamuna-green";
  const sites = await repo.sitesForProject(db, currentProjectId);

  const rawClaims = await db
    .select()
    .from(schema.claims)
    .where(eq(schema.claims.projectId, currentProjectId));

  // Load accepted photos and baseline histories per site
  const acceptedPhotosBySite: Record<string, any[]> = {};
  const baselineHistoriesBySite: Record<string, any[]> = {};

  for (const s of sites) {
    const siteEvidence = await repo.evidenceForSite(db, s.id);
    acceptedPhotosBySite[s.id] = siteEvidence
      .filter((e) => e.status === "accepted")
      .map((e) => ({
        assetId: e.assetId,
        secureUrl: e.secureUrl,
        timepoint: e.timepoint ?? undefined,
      }));

    baselineHistoriesBySite[s.id] = await repo.baselineHistory(db, s.id);
  }

  return (
    <div className="flex h-full flex-col">
      <SetupClient
        projects={projects}
        currentProjectId={currentProjectId}
        sites={sites}
        claims={rawClaims}
        acceptedPhotosBySite={acceptedPhotosBySite}
        baselineHistoriesBySite={baselineHistoriesBySite}
      />
    </div>
  );
}
