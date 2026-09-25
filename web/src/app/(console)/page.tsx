import Link from "next/link";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { Empty } from "@/ui/Empty";
import { GradeGlyph } from "@/ui/marks";
import type { ProjectType } from "@/domain/types";
import { ArrowRight, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConsoleHomePage() {
  const db = await getDb();
  const projects = await repo.listProjects(db);
  const projectId = projects[0]?.id ?? "yamuna-green";
  const project = await repo.project(db, projectId);
  const projectType = (project?.type ?? "plantation") as ProjectType;

  const rows = await repo.readingList(db, projectId);

  // Attention summary sentence
  const contestedCount = rows.filter((r) => r.agreementResult === "contradicts").length;
  const toReviewSites = rows.filter((r) => r.toReviewCount > 0).length;
  const flaggedSites = rows.filter((r) => r.flagCount > 0).length;

  let attentionSummary = "All sites are up to date and consistent with field evidence.";
  const summaryParts: string[] = [];
  if (contestedCount > 0) {
    summaryParts.push(`${contestedCount} site${contestedCount > 1 ? "s are" : " is"} contested by witnesses`);
  }
  if (flaggedSites > 0) {
    summaryParts.push(`${flaggedSites} site${flaggedSites > 1 ? "s have" : " has"} integrity flags`);
  }
  if (toReviewSites > 0) {
    summaryParts.push(`${toReviewSites} site${toReviewSites > 1 ? "s require" : " requires"} reading review`);
  }
  if (summaryParts.length > 0) {
    attentionSummary = summaryParts.join("; ") + ".";
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface-0">
      {/* Header */}
      <div className="border-b border-line bg-surface-1 px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-text-3">
              Reading Station Desk · {project?.name ?? "Environmental Recovery"}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">
              Active Monitoring Sites
            </h1>
            <p className="mt-1.5 font-mono text-[13px] text-attention font-medium">
              {attentionSummary}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/setup"
              className="inline-flex h-9 items-center justify-center rounded-[2px] border border-line bg-surface-0 px-3 font-mono text-[12px] text-text hover:bg-surface-2 transition-colors"
            >
              Configure Sites
            </Link>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="p-8 max-w-6xl">
        {rows.length === 0 ? (
          <Empty
            message="No sites yet. Set up a project and its sites."
            action={
              <Link
                href="/setup"
                className="inline-flex h-8 items-center justify-center rounded-[2px] border border-line bg-surface-1 px-3 text-[12px] text-text hover:bg-surface-2"
              >
                Go to Setup
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[2px] border border-line bg-surface-1">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-line bg-surface-2/60 font-mono text-[11px] uppercase tracking-wider text-text-3">
                <tr>
                  <th className="p-3.5 pl-4">Site</th>
                  <th className="p-3.5">Latest Grade</th>
                  <th className="p-3.5">Last Reading</th>
                  <th className="p-3.5 text-center">To Review</th>
                  <th className="p-3.5">Witnesses</th>
                  <th className="p-3.5 text-center">Flags</th>
                  <th className="p-3.5 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => {
                  const isStale = row.daysSinceLastTimepoint > 7;
                  return (
                    <tr
                      key={row.site.id}
                      className="group transition-colors hover:bg-surface-2/40"
                    >
                      {/* Site Name */}
                      <td className="p-3.5 pl-4">
                        <div className="font-semibold text-text">{row.site.name}</div>
                        <div className="font-mono text-[11px] text-text-3">{row.site.id}</div>
                      </td>

                      {/* Latest Grade */}
                      <td className="p-3.5">
                        {row.latestGrade !== null ? (
                          <GradeGlyph type={projectType} grade={row.latestGrade} size="md" />
                        ) : (
                          <span className="font-mono text-[12px] text-text-3">Pending</span>
                        )}
                      </td>

                      {/* Last Reading Date */}
                      <td className="p-3.5 font-mono text-[12px]">
                        {row.lastReadingDate ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-text">{row.lastReadingDate}</span>
                            {isStale && (
                              <span className="rounded bg-surface-2 px-1 text-[10px] text-text-3">
                                stale ({row.daysSinceLastTimepoint}d)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-3">No readings</span>
                        )}
                      </td>

                      {/* To Review Count */}
                      <td className="p-3.5 text-center font-mono text-[12px]">
                        {row.toReviewCount > 0 ? (
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-[2px] bg-attention/10 px-1.5 font-semibold text-attention">
                            {row.toReviewCount}
                          </span>
                        ) : (
                          <span className="text-text-3">0</span>
                        )}
                      </td>

                      {/* Witnesses */}
                      <td className="p-3.5">
                        {row.agreementResult === "corroborates" ? (
                          <span className="inline-flex items-center gap-1 text-[12px] text-measure">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Corroborates</span>
                          </span>
                        ) : row.agreementResult === "contradicts" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[12px] text-flag">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Contested</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12px] text-text-3">
                            <HelpCircle className="h-3.5 w-3.5" />
                            <span>Insufficient</span>
                          </span>
                        )}
                      </td>

                      {/* Flags */}
                      <td className="p-3.5 text-center font-mono text-[12px]">
                        {row.flagCount > 0 ? (
                          <span className="inline-flex items-center gap-0.5 font-bold text-flag">
                            <span>◆</span>
                            <span>{row.flagCount}</span>
                          </span>
                        ) : (
                          <span className="text-text-3">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3.5 pr-4 text-right">
                        <Link
                          href={`/sites/${row.site.id}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[2px] border border-line bg-surface-0 px-3 font-mono text-[11px] font-medium text-text hover:bg-surface-2 transition-colors"
                        >
                          <span>Read</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
