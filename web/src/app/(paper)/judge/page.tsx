import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownToLine, ArrowRight, Camera, FileCheck2, Images, Upload } from "lucide-react";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { ServiceStatus } from "@/ui/judge/ServiceStatus";

export const dynamic = "force-dynamic";

const SITE_ID = "plot-b";
const REPORT_START = "2026-06-01";
const REPORT_END = "2026-10-11";

type ReportWithCounts = {
  id: string;
  periodStart: string;
  periodEnd: string;
  kept: number;
  struck: number;
  pending: number;
};

function StateLabel({ state, children }: { state: "live" | "seeded" | "pending"; children: ReactNode }) {
  const color = state === "live" ? "border-measure/40 text-measure" : state === "seeded" ? "border-active/40 text-active" : "border-attention/40 text-attention";
  return <span className={`inline-flex rounded-[2px] border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${color}`}>{children}</span>;
}

export default async function JudgePage() {
  let siteName = "Plot B";
  let siteExists = false;
  let hasBaseline = false;
  let followupCount = 0;
  let witnessCount = 0;
  let comparison: { timepoint: string; quality: string; changedArea: number | null; decisionId: number | null; decisionStatus: string | null } | null = null;
  let matchingReport: ReportWithCounts | null = null;
  let ledgerReady = false;
  let siteProjectId = "yamuna-green";

  try {
    const db = await getDb();
    const site = await repo.site(db, SITE_ID);
    if (site) {
      siteExists = true;
      siteName = site.name;
      siteProjectId = site.projectId;
      ledgerReady = true;

      const chart = await repo.siteChart(db, site.id);
      hasBaseline = Boolean(chart.baseline);
      followupCount = chart.candidates.filter((item) => item.source !== "witness" && item.assetId !== site.baselineAssetId).length;
      witnessCount = chart.candidates.filter((item) => item.source === "witness").length;

      const tp = [...chart.timepoints].reverse().find((item) => Boolean(item.derivative?.alignedAssetId));
      if (tp?.derivative) {
        comparison = {
          timepoint: tp.timepoint,
          quality: tp.derivative.quality,
          changedArea: typeof tp.derivative.metrics?.changedAreaFraction === "number" ? tp.derivative.metrics.changedAreaFraction : null,
          decisionId: tp.decision?.id ?? null,
          decisionStatus: tp.decision?.status ?? null,
        };
      }

      const siteEvidenceIds = new Set<string>([
        ...(site.baselineAssetId ? [site.baselineAssetId] : []),
        ...chart.candidates.map((item) => item.assetId),
        ...chart.timepoints.map((item) => item.derivative?.sourceAssetId).filter((id): id is string => Boolean(id)),
      ]);
      for (const report of await repo.reportsForProject(db, site.projectId)) {
        if (report.periodStart !== REPORT_START || report.periodEnd !== REPORT_END) continue;
        const facts = Array.isArray(report.facts) ? report.facts as { evidenceIds?: string[] }[] : [];
        const includesThisSite = facts.some((fact) => fact.evidenceIds?.some((id) => siteEvidenceIds.has(id)));
        if (!includesThisSite) continue;
        const sentences = await repo.sentencesFor(db, report.id);
        const hasSeededControl = sentences.some((sentence) => sentence.text.startsWith("Seeded test control"));
        const counts = {
          kept: sentences.filter((sentence) => sentence.status === "kept").length,
          struck: sentences.filter((sentence) => sentence.status === "struck").length,
          pending: sentences.filter((sentence) => sentence.status === "pending").length,
        };
        if (hasSeededControl && counts.kept > 0 && counts.struck > 0) {
          matchingReport = { id: report.id, periodStart: report.periodStart, periodEnd: report.periodEnd, ...counts };
          break;
        }
      }
    }
  } catch {
    ledgerReady = false;
  }

  const intakeHref = `/intake?siteId=${encodeURIComponent(SITE_ID)}`;
  const chartHref = `/sites/${encodeURIComponent(SITE_ID)}`;
  const witnessHref = `/w/${encodeURIComponent(SITE_ID)}`;
  const reportHref = `/reports?judge=1&projectId=${encodeURIComponent(siteProjectId)}&periodStart=${REPORT_START}&periodEnd=${REPORT_END}`;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10 text-paper-ink sm:px-10">
      <header className="grid gap-8 border-b border-paper-line pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper-ink-muted">SAAKSHYA · JUDGE WALKTHROUGH</div>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl">One evidence trail, from upload to checked report.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-paper-ink-muted">
            Use the existing intake, CV, Jev, witness, and report flows in order. The bundled photo pair is a seeded repository test fixture, not verified field evidence.
          </p>
        </div>
        <div className="border border-paper-line bg-paper-surface p-4 md:min-w-52">
          <div className="font-mono text-[10px] uppercase tracking-wider text-paper-ink-muted">Selected site</div>
          <div className="mt-1 font-serif text-2xl font-bold">{siteName}</div>
          <div className="mt-1 font-mono text-[11px] text-paper-ink-muted">{SITE_ID} · {siteProjectId}</div>
          <div className="mt-3"><StateLabel state={siteExists ? "live" : "pending"}>{siteExists ? "Live ledger site" : "Pending site setup"}</StateLabel></div>
        </div>
      </header>

      <section className="my-7 space-y-3" aria-labelledby="service-status">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="service-status" className="font-serif text-xl font-bold">Service availability</h2>
          <p className="font-mono text-[10px] text-paper-ink-muted">A reachability check is not proof a new job completed.</p>
        </div>
        <ServiceStatus />
      </section>

      <section className="mt-10" aria-labelledby="walkthrough-steps">
        <div className="mb-5 flex items-end justify-between gap-3 border-b border-paper-line pb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-paper-ink-muted">Repeatable case</div>
            <h2 id="walkthrough-steps" className="mt-1 font-serif text-2xl font-bold">Follow the evidence in order</h2>
          </div>
          <Link href="/judge" className="font-mono text-[11px] text-paper-ink-muted underline underline-offset-2">Refresh saved state</Link>
        </div>

        <div className="space-y-4">
          <article className="grid gap-4 border border-paper-line bg-paper-surface p-5 md:grid-cols-[56px_1fr_auto] md:items-start">
            <div className="font-mono text-sm text-paper-ink-muted">01</div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl font-bold">Upload the baseline sample</h3><StateLabel state="seeded">Seeded image + chat date</StateLabel></div>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-paper-ink-muted">Import this ZIP through Intake with the site assignment pinned to Plot B. The seeded baseline is dated 2026-06-20, before the seeded claim period; the integrity review may flag it as out of period. It can still be selected as the comparison baseline. On a clean ledger, open the site page and choose “Set as baseline.”</p>
              <a href="/judge/samples/plot-b-baseline.zip" download className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] font-semibold underline underline-offset-2"><ArrowDownToLine className="h-3.5 w-3.5" />Download baseline ZIP · seeded fixture</a>
            </div>
            <Link href={intakeHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] bg-paper-ink px-4 text-[12px] font-semibold text-paper"><Upload className="h-3.5 w-3.5" />Open Intake</Link>
          </article>

          <article className="grid gap-4 border border-paper-line bg-paper-surface p-5 md:grid-cols-[56px_1fr_auto] md:items-start">
            <div className="font-mono text-sm text-paper-ink-muted">02</div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl font-bold">Upload the follow-up and inspect registration</h3><StateLabel state={comparison ? "live" : "pending"}>{comparison ? "Comparison recorded" : "Pending follow-up + CV worker"}</StateLabel></div>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-paper-ink-muted">Set the baseline first, then import this ZIP. The existing pipeline will attempt alignment and metrics. The comparison page shows its recorded quality and any available change measurements.</p>
              <a href="/judge/samples/plot-b-followup.zip" download className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] font-semibold underline underline-offset-2"><ArrowDownToLine className="h-3.5 w-3.5" />Download follow-up ZIP · seeded fixture</a>
              {comparison && <p className="mt-2 font-mono text-[11px] text-paper-ink-muted">Latest aligned timepoint {comparison.timepoint} · registration {comparison.quality}{comparison.changedArea !== null ? ` · ${Math.round(comparison.changedArea * 100)}% of aligned area changed` : ""}</p>}
            </div>
            <Link href={chartHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] border border-paper-line px-4 text-[12px] font-semibold"><Images className="h-3.5 w-3.5" />Open comparison</Link>
          </article>

          <article className="grid gap-4 border border-paper-line bg-paper-surface p-5 md:grid-cols-[56px_1fr_auto] md:items-start">
            <div className="font-mono text-sm text-paper-ink-muted">03</div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl font-bold">Inspect the actual Jev receipt</h3><StateLabel state={comparison?.decisionStatus === "decided" ? "live" : "pending"}>{comparison?.decisionStatus === "decided" ? "Live decision record" : "Pending Jev decision"}</StateLabel></div>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-paper-ink-muted">The receipt opens the saved decision row for the latest aligned site reading. Pending records show their recorded reason instead of estimated values.</p>
            </div>
            {comparison?.decisionId ? (
              <Link href={`/receipt/${comparison.decisionId}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] border border-paper-line px-4 text-[12px] font-semibold"><FileCheck2 className="h-3.5 w-3.5" />Open receipt #{comparison.decisionId}</Link>
            ) : (
              <Link href={chartHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] border border-paper-line px-4 text-[12px] font-semibold"><ArrowRight className="h-3.5 w-3.5" />Check site state</Link>
            )}
          </article>

          <article className="grid gap-4 border border-paper-line bg-paper-surface p-5 md:grid-cols-[56px_1fr_auto] md:items-start">
            <div className="font-mono text-sm text-paper-ink-muted">04</div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl font-bold">Submit witness evidence</h3><StateLabel state="live">Live witness route</StateLabel>{witnessCount > 0 && <StateLabel state="live">{witnessCount} record{witnessCount === 1 ? "" : "s"} in ledger</StateLabel>}</div>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-paper-ink-muted">Use the camera flow for a real observation of the selected site. The seeded control re-uploads the follow-up fixture and may be flagged as a duplicate; it is not independent testimony. After submission, the witness page links to its ledger record.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={witnessHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] bg-paper-ink px-4 text-[12px] font-semibold text-paper"><Camera className="h-3.5 w-3.5" />Open witness page</Link>
              <Link href={`${witnessHref}?sample=seeded-followup`} className="inline-flex h-10 items-center justify-center rounded-[3px] border border-paper-line px-3 text-[11px] font-semibold">Seeded test control</Link>
            </div>
          </article>

          <article className="grid gap-4 border border-paper-line bg-paper-surface p-5 md:grid-cols-[56px_1fr_auto] md:items-start">
            <div className="font-mono text-sm text-paper-ink-muted">05</div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl font-bold">Finish at the checked report</h3><StateLabel state={matchingReport ? "live" : "pending"}>{matchingReport ? "Report has kept + struck sentences" : "Pending matching report"}</StateLabel></div>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-paper-ink-muted">
                {matchingReport
                  ? `Saved report for ${matchingReport.periodStart} to ${matchingReport.periodEnd}: ${matchingReport.kept} kept, ${matchingReport.struck} struck${matchingReport.pending ? `, ${matchingReport.pending} pending` : ""}.`
                  : "Generate a report for the sample period. The judge flow adds one visibly seeded, uncited control sentence; the normal composer records it as struck for having no receipt. Supported facts still require live drafting and Jev checks."}
              </p>
              {!matchingReport && <p className="mt-2 font-mono text-[11px] text-paper-ink-muted">{ledgerReady ? "The ledger is reachable; report state will update after composition." : "Pending: the selected site or ledger is not available in this deployment."}</p>}
            </div>
            {matchingReport ? (
              <Link href={`/reports/${matchingReport.id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] bg-paper-ink px-4 text-[12px] font-semibold text-paper"><FileCheck2 className="h-3.5 w-3.5" />Open checked report</Link>
            ) : (
              <Link href={reportHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] border border-paper-line px-4 text-[12px] font-semibold"><ArrowRight className="h-3.5 w-3.5" />Generate judge report</Link>
            )}
          </article>
        </div>
      </section>

      <section className="mt-8 border-l-2 border-attention bg-paper-surface px-5 py-4">
        <h2 className="font-serif text-lg font-bold">Setup and reset</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-paper-ink-muted">
          The sample archives include repository test images and their fixture chat dates. They are seeded, not field evidence; their EXIF dates are editable metadata. Evidence writes persist. Re-uploading the same files to this project can trigger duplicate checks, so repeat the walkthrough on a clean/staging ledger rather than deleting records from a shared deployment. If Jev, Cloudinary, or the CV worker is unavailable, the affected step remains pending.
        </p>
        <p className="mt-2 font-mono text-[10px] text-paper-ink-muted">{hasBaseline ? "A baseline is currently set for this site." : "No baseline is currently recorded for this site."} {followupCount} non-witness follow-up evidence item{followupCount === 1 ? "" : "s"} currently in the ledger.</p>
      </section>

      <footer className="mt-10 border-t border-paper-line pt-5 text-[11px] text-paper-ink-muted">
        Seeded inputs remain labeled as seeded. Live status means a service response or ledger record was observed; pending means evidence or an external response is missing.
      </footer>
    </main>
  );
}
