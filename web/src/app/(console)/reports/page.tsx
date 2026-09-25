import Link from "next/link";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { NewReportForm } from "@/ui/report/NewReportForm";
import { Empty } from "@/ui/Empty";
import { FileText, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsIndexPage() {
  const db = getDb();
  const projects = await repo.listProjects(db);
  const projectId = projects[0]?.id ?? "yamuna-green";
  const project = await repo.project(db, projectId);

  const rawReports = await repo.reportsForProject(db, projectId);

  const reportCards = await Promise.all(
    rawReports.map(async (r) => {
      const sentences = await repo.sentencesFor(db, r.id);
      const kept = sentences.filter((s) => s.status === "kept").length;
      const struck = sentences.filter((s) => s.status === "struck").length;
      const pending = sentences.filter((s) => s.status === "pending").length;
      return {
        ...r,
        keptCount: kept,
        struckCount: struck,
        pendingCount: pending,
        totalSentences: sentences.length,
      };
    })
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface-0">
      {/* Header */}
      <div className="border-b border-line bg-surface-1 px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-wider text-text-3">
              <FileText className="h-4 w-4 text-measure" />
              <span>Verifiable Narrative Synthesis</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">
              Attributable Reports
            </h1>
            <p className="mt-1 text-[13px] text-text-2">
              Every drafted statement is verified against ledger receipts. Unattributable claims are automatically withheld.
            </p>
          </div>

          <NewReportForm
            projectId={projectId}
            defaultStart="2026-09-01"
            defaultEnd="2026-09-30"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="p-8 max-w-5xl">
        {reportCards.length === 0 ? (
          <Empty
            message="No reports generated yet for this project."
          />
        ) : (
          <div className="space-y-4">
            {reportCards.map((r) => (
              <div
                key={r.id}
                className="group relative flex flex-wrap items-center justify-between gap-4 rounded-[2px] border border-line bg-surface-1 p-5 transition-colors hover:border-text-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono text-[12px] text-text-3">
                    <span>Period: {r.periodStart} → {r.periodEnd}</span>
                    <span>·</span>
                    <span>Created {new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-base font-semibold text-text">
                    Audit Synthesis ({r.periodStart.slice(0, 7)})
                  </h3>

                  <div className="flex items-center gap-4 pt-1 font-mono text-[12px]">
                    <span className="flex items-center gap-1 text-measure font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {r.keptCount} supported sentences
                    </span>
                    {r.struckCount > 0 && (
                      <span className="flex items-center gap-1 text-flag font-medium">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {r.struckCount} withheld overclaims
                      </span>
                    )}
                    {r.pendingCount > 0 && (
                      <span className="text-attention">
                        ◌ {r.pendingCount} pending verification
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/reports/${r.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[2px] border border-line bg-surface-0 px-3.5 text-[12px] font-medium text-text hover:bg-surface-2 transition-colors"
                  >
                    <span>Read Report</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
