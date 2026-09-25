import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { SearchClient } from "@/ui/search/SearchClient";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const db = getDb();
  const projects = await repo.listProjects(db);
  const projectId = projects[0]?.id ?? "yamuna-green";
  const sites = await repo.sitesForProject(db, projectId);

  return (
    <div className="flex h-full flex-col">
      <SearchClient
        projectId={projectId}
        sites={sites.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
