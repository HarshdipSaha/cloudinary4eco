import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { ReviewClient } from "@/ui/review/ReviewClient";
import type { ProjectType } from "@/domain/types";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const db = await getDb();
  const projects = await repo.listProjects(db);
  const projectId = projects[0]?.id ?? "yamuna-green";
  const project = await repo.project(db, projectId);
  const projectType = (project?.type ?? "plantation") as ProjectType;

  const queue = await repo.reviewQueue(db, projectId);

  return (
    <div className="flex h-full flex-col">
      <ReviewClient
        projectId={projectId}
        projectType={projectType}
        initialQueue={queue}
      />
    </div>
  );
}
