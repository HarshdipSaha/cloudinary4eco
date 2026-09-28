import Link from "next/link";
import { Camera, MapPin } from "lucide-react";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";

export const dynamic = "force-dynamic";

export default async function WitnessSitesPage() {
  const db = await getDb();
  const projects = await repo.listProjects(db);
  const projectId = projects[0]?.id ?? "yamuna-green";
  const sites = await repo.sitesForProject(db, projectId);

  return (
    <main className="mx-auto w-full max-w-4xl p-6 md:p-10">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded border border-line bg-surface-1 text-measure">
          <Camera className="size-5" />
        </div>
        <div>
          <p className="mono text-[11px] uppercase tracking-wider text-text-3">Field evidence</p>
          <h1 className="mt-1 text-2xl font-semibold text-text">Choose a site to witness</h1>
          <p className="mt-2 text-sm text-text-2">Select a site to open its camera and submit a field photo.</p>
        </div>
      </div>

      {sites.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded border border-line bg-surface-1">
          {sites.map((site) => (
            <li key={site.id}>
              <Link
                href={`/w/${site.qrSlug ?? site.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-2"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <MapPin className="size-4 shrink-0 text-text-3" />
                  <span className="min-w-0">
                    <span className="block font-medium text-text">{site.name}</span>
                    <span className="mono mt-0.5 block text-[11px] text-text-3">{site.id}</span>
                  </span>
                </span>
                <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded border border-line bg-surface-0 px-3 text-sm text-text">
                  <Camera className="size-4" /> Open camera
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded border border-line bg-surface-1 p-5 text-sm text-text-2">No sites are configured yet.</p>
      )}
    </main>
  );
}
