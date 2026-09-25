import { notFound } from "next/navigation";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { ReportSheet } from "@/ui/report/ReportSheet";

export const dynamic = "force-dynamic";

export default async function PublicReportViewPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const db = await getDb();
  const r = await repo.reportBySlug(db, slug);
  if (!r) notFound();

  const sentences = await repo.sentencesFor(db, r.id);
  const project = await repo.project(db, r.projectId);
  const sites = await repo.sitesForProject(db, r.projectId);

  const photoCount = r.facts.reduce((sum, f) => sum + (f.evidenceIds?.length ?? 0), 0);

  return (
    <main className="min-h-screen bg-paper py-8">
      <ReportSheet
        report={{
          id: r.id,
          publicSlug: r.publicSlug,
          periodStart: r.periodStart,
          periodEnd: r.periodEnd,
          createdAt: r.createdAt,
        }}
        sentences={sentences as any}
        facts={r.facts as any}
        projectName={project?.name ?? "Environmental Restoration"}
        siteCount={sites.length}
        photoCount={photoCount}
        isPublic={true}
      />
    </main>
  );
}
