import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ServiceLamps } from "@/ui/ServiceLamps";
import { ReliabilityDiagram, type ReliabilityBin } from "@/ui/trust/Reliability";
import { Empty } from "@/ui/Empty";
import { wilsonInterval } from "@/domain/calibration";
import { ShieldCheck, Info, CheckCircle2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface CalibrationResults {
  source: string;
  runAt: string;
  model: string;
  n: number;
  kinds: Record<
    string,
    {
      nTune: number;
      nTest: number;
      byOrigin: Record<string, number>;
      test: { accuracy: number; brier: number; ece: number; bins: ReliabilityBin[] };
      threshold: number;
      thresholdOnTest: { coverage: number; accuracy: number };
    }
  >;
}

interface Miss {
  id: string;
  kind: string;
  label: string;
  answer: string;
  confidence: number;
  note: string;
}

const KIND_META: Record<string, { title: string; desc: string }> = {
  triage_relevance: {
    title: "Evidence Relevance",
    desc: "Distinguishes physical fieldwork evidence from screenshots, people-only photos, and unusable images, from text about the photo.",
  },
  triage_site: {
    title: "Site Identification",
    desc: "Matches a photo to a registered site from its text and GPS distance, or answers none.",
  },
  src_grade: {
    title: "SRC Site Response Grade",
    desc: "Jev scores the site response using available captions and CV measurements against the project rubric.",
  },
};

function readJson<T>(path: string): T | null {
  const full = resolve(process.cwd(), path);
  if (!existsSync(full)) return null;
  try {
    return JSON.parse(readFileSync(full, "utf-8")) as T;
  } catch {
    return null;
  }
}

/** Held-out cases Jev got wrong, most confident first, with the reason the case was written. */
function heldOutMisses(): Miss[] {
  const file = (path: string) => {
    const full = resolve(process.cwd(), path);
    return existsSync(full) ? readFileSync(full, "utf-8").split(/\r?\n/).filter((l) => l.trim()) : [];
  };
  const notes = new Map(file("calibration/cases.jsonl").map((l) => JSON.parse(l) as { id: string; note: string }).map((c) => [c.id, c.note]));
  return file("calibration/predictions.jsonl")
    .map((l) => JSON.parse(l) as { id: string; kind: string; split: string; label: string; answer: string; probabilities: Record<string, number> })
    .filter((p) => p.split === "test" && p.answer !== p.label)
    .map((p) => ({
      id: p.id,
      kind: p.kind,
      label: p.label,
      answer: p.answer,
      confidence: Math.max(...Object.values(p.probabilities)),
      note: notes.get(p.id) ?? "",
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;

export default async function TrustPage() {
  const raw = readJson<CalibrationResults>("calibration/results.json");
  // Only numbers that came from a live Jev run are shown; anything else counts as not calibrated.
  const calibration = raw?.source === "live-jev" ? raw : null;
  const misses = calibration ? heldOutMisses() : [];

  const origins = calibration
    ? Object.values(calibration.kinds).reduce<Record<string, number>>((acc, k) => {
        for (const [origin, n] of Object.entries(k.byOrigin)) acc[origin] = (acc[origin] ?? 0) + n;
        return acc;
      }, {})
    : {};
  const hasLedgerCases = (origins.ledger ?? 0) > 0;

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
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">Trust & Reliability Center</h1>
            <p className="mt-1 max-w-3xl text-[13px] text-text-2">
              Measured on a held-out half of a labelled corpus; thresholds are chosen on the other half. Jev reads text about a photo, not the pixels.
              These results may not cover every live decision or deployment.
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
          <Empty message="Not calibrated with live Jev yet. Run npm run calibrate with a TypeSafe key." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Meta (1 col) */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-[2px] border border-line bg-surface-1 p-4 space-y-4">
                <div>
                  <span className="font-mono text-[11px] text-text-3 uppercase tracking-wider block">Model in evaluation artifact</span>
                  <span className="font-mono text-base font-semibold text-text">{calibration.model || "Not recorded"}</span>
                </div>
                <div>
                  <span className="font-mono text-[11px] text-text-3 uppercase tracking-wider block">Last live run</span>
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
                  <span className="font-mono text-[11px] text-text-3 uppercase tracking-wider block">Evaluation corpus</span>
                  <span className="font-mono text-base font-semibold text-measure">{calibration.n} labelled cases</span>
                  <p className="mt-1 text-[12px] text-text-3">
                    {origins.authored ?? 0} authored scenarios · {origins.ledger ?? 0} labelled ledger photos
                  </p>
                </div>
              </div>

              {!hasLedgerCases && (
                <div className="rounded-[2px] border border-attention/40 bg-surface-1 p-4 space-y-2 text-[12px]">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-text-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-attention" />
                    <span>Authored scenarios only</span>
                  </div>
                  <p className="text-text-3 leading-relaxed">
                    Every case was written from the rubric text by the project's developers with an AI assistant, not by independent labellers. None is a real field photo, so these figures show how Jev reads clear and
                    borderline descriptions, not its accuracy on real submissions.
                  </p>
                </div>
              )}

              <div className="rounded-[2px] border border-line bg-surface-1 p-4 space-y-2 text-[12px]">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-text-2">
                  <Info className="h-3.5 w-3.5 text-attention" />
                  <span>Small-sample notice</span>
                </div>
                <p className="text-text-3 leading-relaxed">
                  Each held-out set has fewer than 100 cases, so every rate carries a wide 95% interval (shown on each card). ECE depends on binning and sample
                  size; the Brier score complements it, and neither is ground truth.
                </p>
              </div>
            </div>

            {/* Decision Kind Cards (3 cols) */}
            <div className="space-y-6 lg:col-span-3">
              {Object.entries(calibration.kinds).map(([kindKey, k]) => {
                const meta = KIND_META[kindKey] ?? { title: kindKey.replaceAll("_", " "), desc: "Discrete rubric category returned by Jev." };
                const ci = wilsonInterval(k.test.accuracy, k.nTest);
                const kindMisses = misses.filter((m) => m.kind === kindKey);

                return (
                  <div key={kindKey} className="rounded-[2px] border border-line bg-surface-1 p-6 space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-text">{meta.title}</h2>
                        <p className="text-[13px] text-text-2">{meta.desc}</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-[2px] bg-measure/10 border border-measure/30 px-3 py-1 text-measure font-mono text-[12px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          Accept ≥ {k.threshold}: {pct(k.thresholdOnTest.coverage)} of test cases, {pct(k.thresholdOnTest.accuracy)} correct
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 font-mono text-center">
                          <div className="rounded-[2px] border border-line bg-surface-0 p-3">
                            <span className="text-[10px] text-text-3 uppercase block">Accuracy</span>
                            <span className="text-xl font-bold text-text">{pct(k.test.accuracy, 1)}</span>
                          </div>
                          <div className="rounded-[2px] border border-line bg-surface-0 p-3">
                            <span className="text-[10px] text-text-3 uppercase block">Brier</span>
                            <span className="text-xl font-bold text-measure">{k.test.brier.toFixed(3)}</span>
                          </div>
                          <div className="rounded-[2px] border border-line bg-surface-0 p-3">
                            <span className="text-[10px] text-text-3 uppercase block">ECE</span>
                            <span className="text-xl font-bold text-text-2">{k.test.ece.toFixed(3)}</span>
                          </div>
                        </div>
                        <p className="text-[13px] text-text-2 leading-relaxed">
                          On {k.nTest} held-out cases, Jev&rsquo;s top answer was right{" "}
                          <strong className="text-text font-semibold">{pct(k.test.accuracy, 1)}</strong> of the time (95% interval {pct(ci.low)}–{pct(ci.high)}).
                        </p>
                        <p className="text-[12px] text-text-3">
                          Threshold {k.threshold} was chosen on {k.nTune} separate tuning cases. Below it, decisions go to the human review queue.
                        </p>
                      </div>
                      <div className="flex justify-center border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6">
                        <ReliabilityDiagram bins={k.test.bins} />
                      </div>
                    </div>

                    <div className="border-t border-line pt-4">
                      <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-3">
                        Held-out cases Jev got wrong ({kindMisses.length})
                      </h3>
                      {kindMisses.length === 0 ? (
                        <p className="mt-2 text-[12px] text-text-3">None in this held-out set.</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5 text-[12px]">
                          {kindMisses.slice(0, 6).map((m) => (
                            <li key={m.id} className="flex flex-wrap gap-x-2 text-text-2">
                              <span className="mono text-text">
                                {m.label} → {m.answer}
                              </span>
                              <span className="mono text-text-3">at {pct(m.confidence)}</span>
                              <span className="text-text-3">{m.note}</span>
                            </li>
                          ))}
                        </ul>
                      )}
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
