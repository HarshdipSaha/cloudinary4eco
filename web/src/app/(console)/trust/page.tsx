import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ServiceLamps } from "@/ui/ServiceLamps";
import { ReliabilityDiagram, type ReliabilityBin } from "@/ui/trust/Reliability";
import { Empty } from "@/ui/Empty";
import { ShieldCheck, Info, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface CalibrationResults {
  runAt: string;
  model: string;
  n: number;
  kinds: Record<
    string,
    {
      n: number;
      accuracy: number;
      brier: number;
      ece: number;
      threshold: number;
      coverage: number;
      targetAccuracy: number;
      bins: ReliabilityBin[];
    }
  >;
}

const KIND_META: Record<string, { title: string; desc: string }> = {
  triage_relevance: {
    title: "Evidence Relevance",
    desc: "Distinguishes physical fieldwork evidence from screenshots, memes, and unrelated photos.",
  },
  triage_site: {
    title: "Site Identification",
    desc: "Matches untagged or approximate photos to known restoration plots.",
  },
  grade_src: {
    title: "SRC Ecological Grade",
    desc: "Jev scores the site response using available captions and CV measurements against the project rubric.",
  },
};

export default async function TrustPage() {
  const resultsPath = resolve(process.cwd(), "calibration/results.json");
  let calibration: CalibrationResults | null = null;

  if (existsSync(resultsPath)) {
    try {
      calibration = JSON.parse(readFileSync(resultsPath, "utf-8"));
    } catch {
      calibration = null;
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface-0">
      {/* Top Header */}
      <div className="border-b border-line bg-surface-1 px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-wider text-text-3">
              <ShieldCheck className="h-4 w-4 text-measure" />
              <span>Model Verifiability & Calibration</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">
              Trust & Reliability Center
            </h1>
            <p className="mt-1 text-[13px] text-text-2">
              This page shows the latest saved evaluation artifact when one is available. Its results may not cover every live decision or deployment.
            </p>
          </div>
          <div className="rounded-[2px] border border-line bg-surface-0 p-3">
            <span className="font-mono text-[11px] text-text-3 block mb-1">Live Backend Status</span>
            <ServiceLamps />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-8">
        {!calibration ? (
          <Empty
            message="Not calibrated yet. Run npm run calibrate after labelling photos."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Meta (1 col) */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-[2px] border border-line bg-surface-1 p-4 space-y-4">
                <div>
                  <span className="font-mono text-[11px] text-text-3 uppercase tracking-wider block">
                    Model in evaluation artifact
                  </span>
                  <span className="font-mono text-base font-semibold text-text">
                    {calibration.model || "Not recorded"}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] text-text-3 uppercase tracking-wider block">
                    Last Benchmark Run
                  </span>
                  <span className="font-mono text-[13px] text-text">
                    {new Date(calibration.runAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] text-text-3 uppercase tracking-wider block">
                    Evaluation Corpus
                  </span>
                  <span className="font-mono text-base font-semibold text-measure">
                    {calibration.n} labelled photos & grades
                  </span>
                </div>
              </div>

              {/* Scientific Caveat from LITERATURE_RECOMMENDATIONS.md */}
              <div className="rounded-[2px] border border-line bg-surface-1 p-4 space-y-2 text-[12px]">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-text-2">
                  <Info className="h-3.5 w-3.5 text-attention" />
                  <span>Small-Sample ECE Notice</span>
                </div>
                <p className="text-text-3 leading-relaxed">
                  ECE depends on binning and sample size. The Brier score complements ECE; neither is ground truth. These results describe only the labeled evaluation corpus shown here.
                </p>
              </div>
            </div>

            {/* Decision Kind Cards (3 cols) */}
            <div className="space-y-6 lg:col-span-3">
              {Object.entries(calibration.kinds).map(([kindKey, kData]) => {
                const meta = KIND_META[kindKey] ?? {
                  title: kindKey.replace("_", " "),
                  desc: "Discrete rubric category returned by Jev.",
                };
                const pctAcc = (kData.accuracy * 100).toFixed(1);
                const pctCov = (kData.coverage * 100).toFixed(0);

                return (
                  <div
                    key={kindKey}
                    className="rounded-[2px] border border-line bg-surface-1 p-6 space-y-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-text">{meta.title}</h2>
                        <p className="text-[13px] text-text-2">{meta.desc}</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-[2px] bg-measure/10 border border-measure/30 px-3 py-1 text-measure font-mono text-[12px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Accept Threshold: &gt;= {kData.threshold} ({pctCov}% coverage)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Metrics block */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 font-mono text-center">
                          <div className="rounded-[2px] border border-line bg-surface-0 p-3">
                            <span className="text-[10px] text-text-3 uppercase block">Accuracy</span>
                            <span className="text-xl font-bold text-text">{pctAcc}%</span>
                          </div>
                          <div className="rounded-[2px] border border-line bg-surface-0 p-3">
                            <span className="text-[10px] text-text-3 uppercase block">Brier Score</span>
                            <span className="text-xl font-bold text-measure">{kData.brier.toFixed(3)}</span>
                          </div>
                          <div className="rounded-[2px] border border-line bg-surface-0 p-3">
                            <span className="text-[10px] text-text-3 uppercase block">ECE</span>
                            <span className="text-xl font-bold text-text-2">{kData.ece.toFixed(3)}</span>
                          </div>
                        </div>

                        <p className="text-[13px] text-text-2 leading-relaxed">
                          When Jev says 90% sure on {meta.title.toLowerCase()}, it was right{" "}
                          <strong className="text-text font-semibold">{pctAcc}%</strong> of the time on our held-out field photos.
                        </p>

                        <div className="text-[12px] text-text-3">
                          Photos with model confidence below <span className="font-mono text-text">{kData.threshold}</span> are strictly routed to the Human Auditor Review Queue.
                        </div>
                      </div>

                      {/* Reliability SVG */}
                      <div className="flex justify-center border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6">
                        <ReliabilityDiagram bins={kData.bins} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
