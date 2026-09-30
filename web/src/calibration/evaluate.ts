import { createHash } from "node:crypto";
import { accuracy, brier, ece, pickThreshold, reliabilityBins, type Scored } from "@/domain/calibration";
import type { DecisionsPort } from "@/ports/decisions";
import type { CalibrationCase } from "./cases";

export type Split = "tune" | "test";
export interface Prediction {
  id: string;
  kind: CalibrationCase["kind"];
  origin: CalibrationCase["origin"];
  split: Split;
  label: string;
  answer: string;
  probabilities: Record<string, number>;
  model: string;
}

const BINS = 5;

/** Deterministic half-and-half split by id, so a case never moves between tune and test. */
export const splitOf = (id: string): Split => (createHash("sha256").update(id).digest()[0]! % 2 === 0 ? "tune" : "test");

export async function runEvaluation(port: DecisionsPort, cases: CalibrationCase[]): Promise<Prediction[]> {
  const out = new Map<string, Prediction>();
  const record = (c: CalibrationCase, d: { answer: unknown; probabilities: Record<string, number>; model: string }) =>
    out.set(c.id, {
      id: c.id,
      kind: c.kind,
      origin: c.origin,
      split: splitOf(c.id),
      label: String(c.label),
      answer: String(d.answer),
      probabilities: d.probabilities,
      model: d.model,
    });

  const triageCases = cases.filter((c) => c.kind !== "src_grade") as Exclude<CalibrationCase, { kind: "src_grade" }>[];
  const results = await port.triage(
    triageCases.map((c) => ({
      assetId: c.id,
      card: c.card,
      projectType: c.projectType,
      candidateSites: c.kind === "triage_site" ? c.candidateSites : [],
    }))
  );
  for (const [i, r] of results.entries()) {
    const c = triageCases[i]!;
    const d = c.kind === "triage_site" ? r.site : r.relevance;
    if (!d) throw new Error(`Jev returned no ${c.kind} decision for ${c.id}`);
    record(c, d);
  }

  for (const c of cases) {
    if (c.kind !== "src_grade") continue;
    record(c, await port.gradeSite({ siteId: c.id, timepoint: "calibration", projectType: c.projectType, ...c.input }));
  }
  return cases.map((c) => out.get(c.id)!);
}

const round = (n: number, places = 3) => Math.round(n * 10 ** places) / 10 ** places;
const scored = (ps: Prediction[]): Scored[] => ps.map((p) => ({ probabilities: p.probabilities, label: p.label }));

export function summarise(preds: Prediction[], targetAccuracy = 0.95) {
  const kinds: Record<
    string,
    {
      nTune: number;
      nTest: number;
      byOrigin: Record<string, number>;
      test: { accuracy: number; brier: number; ece: number; bins: ReturnType<typeof reliabilityBins> };
      threshold: number;
      thresholdOnTest: { coverage: number; accuracy: number };
    }
  > = {};
  for (const kind of [...new Set(preds.map((p) => p.kind))]) {
    const all = preds.filter((p) => p.kind === kind);
    const tune = scored(all.filter((p) => p.split === "tune"));
    const test = scored(all.filter((p) => p.split === "test"));
    const threshold = pickThreshold(tune, targetAccuracy).threshold;
    const kept = test.filter((s) => Math.max(...Object.values(s.probabilities)) >= threshold);
    kinds[kind] = {
      nTune: tune.length,
      nTest: test.length,
      byOrigin: all.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.origin]: (acc[p.origin] ?? 0) + 1 }), {}),
      test: { accuracy: round(accuracy(test)), brier: round(brier(test)), ece: round(ece(test, BINS)), bins: reliabilityBins(test, BINS) },
      threshold: round(threshold, 2),
      thresholdOnTest: { coverage: test.length ? round(kept.length / test.length, 2) : 0, accuracy: round(accuracy(kept), 2) },
    };
  }
  return { targetAccuracy, bins: BINS, kinds };
}
