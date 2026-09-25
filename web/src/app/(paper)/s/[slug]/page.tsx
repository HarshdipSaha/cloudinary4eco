import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { cld } from "@/ui/cld";
import { SequencePlayer, type SequenceFrame } from "@/ui/public/SequencePlayer";
import { SRC_RUBRICS } from "@/domain/src-rubrics";
import type { ProjectType } from "@/domain/types";
import { Camera, Download, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicSitePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const db = await getDb();
  const site = await repo.siteBySlug(db, slug);
  if (!site) notFound();

  const chart = await repo.siteChart(db, site.id);
  const project = chart.project;
  const projectType = (project?.type ?? "plantation") as ProjectType;
  const rubric = SRC_RUBRICS[projectType] ?? SRC_RUBRICS.plantation;

  // Build sequence frames: baseline + one best derivative/source per timepoint
  const frames: SequenceFrame[] = [];
  if (chart.baseline) {
    frames.push({
      timepoint: "Baseline",
      assetId: chart.baseline.assetId,
      label: "Baseline",
      grade: null,
    });
  }

  for (const tp of chart.timepoints) {
    const frameAssetId =
      tp.derivative?.alignedAssetId ?? tp.derivative?.sourceAssetId ?? tp.photos[0]?.assetId;
    if (frameAssetId) {
      frames.push({
        timepoint: tp.timepoint,
        assetId: frameAssetId,
        label: tp.derivative?.alignedAssetId ? "Aligned" : "Follow-up",
        grade: tp.grade,
      });
    }
  }

  const latestTimepoint = chart.timepoints.at(-1);
  const latestGrade = latestTimepoint?.grade ?? null;
  const latestGradeLabel =
    latestGrade !== null && rubric.labels[latestGrade]
      ? rubric.labels[latestGrade]
      : latestGrade !== null
      ? `Grade ${latestGrade}`
      : "Not yet graded";
  const isConfirmed = latestTimepoint?.status === "signed";

  // Witness agreement
  const agreement = chart.agreement;

  // Social download URLs (baseline vs latest)
  const baselineId = chart.baseline?.assetId;
  const latestAssetId = frames.at(-1)?.assetId;
  const squareDownload =
    baselineId && latestAssetId
      ? cld.social({ beforeId: baselineId, afterId: latestAssetId }, "1:1", 1080)
      : null;
  const verticalDownload =
    baselineId && latestAssetId
      ? cld.social({ beforeId: baselineId, afterId: latestAssetId }, "9:16", 1080)
      : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-paper-ink">
      {/* Top Banner & Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper-line pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-wider text-paper-ink-muted">
            <ShieldCheck className="h-4 w-4 text-measure" />
            <span>SAAKSHYA PUBLIC VERIFICATION LEDGER</span>
          </div>
          <h1 className="mt-2 font-serif text-[40px] font-bold leading-tight tracking-tight">
            {site.name}
          </h1>
          <p className="mt-1 text-[15px] text-paper-ink-muted">
            Project: <span className="font-medium text-paper-ink">{project?.name ?? "Environmental Recovery"}</span>
          </p>
        </div>

        {/* Action: Add Photo / Witness */}
        <div>
          <Link
            href={`/w/${site.qrSlug ?? slug}`}
            className="flex h-12 items-center gap-2 rounded-[4px] bg-measure px-5 text-[14px] font-semibold text-measure-ink shadow-sm transition-opacity hover:opacity-90 active:scale-98"
          >
            <Camera className="h-4 w-4" />
            <span>Add your photo</span>
          </Link>
        </div>
      </div>

      {/* Status Summary & Reading Verdict */}
      <div className="my-8 rounded-[4px] border border-paper-line bg-paper-surface p-6 space-y-4">
        <div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-paper-ink-muted block mb-1">
            Current Standing
          </span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-bold">
              {latestTimepoint ? `Latest reading, ${latestTimepoint.timepoint}:` : "Initial Monitoring:"}
            </span>
            <span className="font-serif text-2xl font-bold text-measure">
              ▲ {latestGradeLabel}
            </span>
            <span className="text-[14px] text-paper-ink-muted">
              {isConfirmed ? "(confirmed by a reviewer)" : "(model reading, not yet confirmed)"}
            </span>
          </div>
        </div>

        {/* Witness Agreement */}
        {agreement && (
          <div className="flex items-center gap-2 pt-2 border-t border-paper-line text-[14px]">
            {agreement.result === "corroborates" ? (
              <CheckCircle2 className="h-4 w-4 text-measure shrink-0" />
            ) : agreement.result === "contradicts" ? (
              <AlertTriangle className="h-4 w-4 text-flag shrink-0" />
            ) : (
              <span className="mono text-paper-ink-muted">◌</span>
            )}
            <span>
              Witness community reports{" "}
              <strong className="font-semibold">{agreement.result ?? "under evaluation"}</strong> the project claims.
            </span>
          </div>
        )}
      </div>

      {/* Visual Sequence Player (Pixelated Faces) */}
      <section className="my-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold">Time-lapse verification</h2>
          <span className="font-mono text-[12px] text-paper-ink-muted">
            All faces pixelated for privacy
          </span>
        </div>
        <SequencePlayer frames={frames} />
      </section>

      {/* Metric Breakdown Table */}
      <section className="my-10 space-y-4">
        <h2 className="font-serif text-2xl font-bold">Recorded observations</h2>
        <div className="overflow-x-auto rounded-[4px] border border-paper-line">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-paper-line bg-paper-surface font-mono text-[11px] uppercase tracking-wider text-paper-ink-muted">
              <tr>
                <th className="p-3">Timepoint</th>
                <th className="p-3">SRC Grade</th>
                <th className="p-3">Green ExG Index</th>
                <th className="p-3">Canopy Change</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {chart.timepoints.map((tp) => (
                <tr key={tp.timepoint} id={`tp-${tp.timepoint}`} className="hover:bg-paper-surface/50">
                  <td className="p-3 font-mono font-medium">
                    <a href={`#tp-${tp.timepoint}`} className="hover:underline">
                      {tp.timepoint}
                    </a>
                  </td>
                  <td className="p-3 font-medium">
                    {tp.grade !== null ? `Grade ${tp.grade} (${rubric.labels[tp.grade] ?? "Level " + tp.grade})` : "—"}
                  </td>
                  <td className="p-3 font-mono">
                    {tp.derivative?.metrics?.exg_p90 !== undefined
                      ? (tp.derivative.metrics.exg_p90 * 100).toFixed(1) + "%"
                      : "—"}
                  </td>
                  <td className="p-3 font-mono">
                    {tp.derivative?.metrics?.exg_diff_mean !== undefined
                      ? (tp.derivative.metrics.exg_diff_mean > 0 ? "+" : "") +
                        (tp.derivative.metrics.exg_diff_mean * 100).toFixed(1) + "%"
                      : "—"}
                  </td>
                  <td className="p-3 capitalize text-paper-ink-muted">
                    {tp.status.replace("_", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Share / Social Downloads */}
      {(squareDownload || verticalDownload) && (
        <section className="my-10 rounded-[4px] border border-paper-line bg-paper-surface p-6 space-y-4">
          <h2 className="font-serif text-xl font-bold">Verifiable social assets</h2>
          <p className="text-[14px] text-paper-ink-muted">
            Download side-by-side composite images with dates burned in, prepared for publication and audit reporting.
          </p>
          <div className="flex flex-wrap gap-3">
            {squareDownload && (
              <a
                href={squareDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 items-center gap-2 rounded-[4px] border border-paper-line bg-paper px-4 font-mono text-[12px] font-medium text-paper-ink hover:bg-paper-surface"
              >
                <Download className="h-4 w-4" />
                <span>Square (1:1 Post)</span>
              </a>
            )}
            {verticalDownload && (
              <a
                href={verticalDownload}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 items-center gap-2 rounded-[4px] border border-paper-line bg-paper px-4 font-mono text-[12px] font-medium text-paper-ink hover:bg-paper-surface"
              >
                <Download className="h-4 w-4" />
                <span>Vertical (9:16 Story)</span>
              </a>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
