import { redirect } from "next/navigation";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import Link from "next/link";
import { Empty } from "@/ui/Empty";

export default async function SitesIndexPage() {
  const db = getDb();
  const projects = await repo.listProjects(db);
  const projectId = projects[0]?.id ?? "yamuna-green";
  const sites = await repo.sitesForProject(db, projectId);

  if (sites.length > 0) {
    redirect(`/sites/${sites[0]!.id}`);
  }

  return (
    <div className="flex h-full flex-col p-8">
      <h1 className="text-xl font-bold">Reading Station</h1>
      <div className="mt-8">
        <Empty
          message="No sites configured yet for this project."
          action={
            <Link
              href="/setup"
              className="inline-flex h-8 items-center justify-center rounded-[2px] border border-line bg-surface-1 px-3 text-[12px] text-text hover:bg-surface-2"
            >
              Configure sites in Setup
            </Link>
          }
        />
      </div>
    </div>
  );
}
