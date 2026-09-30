import { describe, expect, it } from "vitest";
import type { CalibrationCase } from "@/calibration/cases";
import { runEvaluation, splitOf, summarise, type Prediction } from "@/calibration/evaluate";
import type { DecisionsPort } from "@/ports/decisions";

const card = { caption: "c", tags: [], ocrText: null, comment: null, filename: null, capturedAt: null };
const decision = (kind: string, subjectId: string, answer: unknown, probabilities: Record<string, number>) =>
  ({ kind, subjectId, answer, probabilities, confidence: Math.max(...Object.values(probabilities)), model: "jev-test", latencyMs: 1, inputTokens: 1 }) as any;

const port: DecisionsPort = {
  async triage(inputs) {
    return inputs.map((t) => ({
      assetId: t.assetId,
      site: t.candidateSites.length ? decision("triage_site", t.assetId, "plot-b", { "plot-b": 0.8, none: 0.2 }) : null,
      relevance: decision("triage_relevance", t.assetId, "evidence", { evidence: 0.9, people_only: 0.05, screenshot_or_meme: 0.03, unusable_quality: 0.02 }),
      activity: decision("triage_activity", t.assetId, "planting", { planting: 1 }),
    }));
  },
  async gradeSite() { return decision("src_grade", "g", 2, { "0": 0.1, "1": 0.1, "2": 0.7, "3": 0.1 }); },
  async witnessAgreement() { throw new Error("unused"); },
  async sentenceSupport() { throw new Error("unused"); },
  async searchRelevance() { throw new Error("unused"); },
};

const cases: CalibrationCase[] = [
  { id: "r1", origin: "authored", note: "note", kind: "triage_relevance", projectType: "plantation", card, label: "evidence" },
  { id: "s1", origin: "ledger", note: "note", kind: "triage_site", projectType: "plantation", card,
    candidateSites: [{ id: "plot-b", name: "Plot B", description: "", distanceM: 10 }], label: "none" },
  { id: "g1", origin: "authored", note: "note", kind: "src_grade", projectType: "plantation",
    input: { baselineCaption: null, followupCaption: null, registrationQuality: "good", daysSinceBaseline: 30, metrics: null }, label: 2 },
];

describe("splitOf", () => {
  it("is deterministic and roughly balanced", () => {
    expect(splitOf("abc")).toBe(splitOf("abc"));
    const ids = Array.from({ length: 400 }, (_, i) => `case_${i}`);
    const tune = ids.filter((id) => splitOf(id) === "tune").length;
    expect(tune).toBeGreaterThan(160);
    expect(tune).toBeLessThan(240);
  });
});

describe("runEvaluation", () => {
  it("records Jev's probabilities against the human label for each kind", async () => {
    const preds = await runEvaluation(port, cases);
    expect(preds.map((p) => [p.id, p.kind, p.answer, p.label, p.origin])).toEqual([
      ["r1", "triage_relevance", "evidence", "evidence", "authored"],
      ["s1", "triage_site", "plot-b", "none", "ledger"],
      ["g1", "src_grade", "2", "2", "authored"],
    ]);
    expect(preds[2]!.probabilities["2"]).toBe(0.7);
  });
});

describe("summarise", () => {
  const p = (id: string, split: "tune" | "test", top: number, correct: boolean): Prediction => ({
    id, kind: "triage_relevance", origin: "authored", split, model: "jev-test",
    label: "evidence", answer: correct ? "evidence" : "people_only",
    probabilities: correct ? { evidence: top, people_only: 1 - top } : { evidence: 1 - top, people_only: top },
  });

  it("reports metrics on test only and picks the threshold on tune only", () => {
    const preds = [p("a", "tune", 0.9, true), p("b", "tune", 0.6, false), p("c", "test", 0.95, true), p("d", "test", 0.7, false)];
    const kind = summarise(preds, 0.95).kinds.triage_relevance!;
    expect(kind.nTune).toBe(2);
    expect(kind.nTest).toBe(2);
    expect(kind.test.accuracy).toBe(0.5);
    expect(kind.threshold).toBe(0.9); // chosen from tune
    expect(kind.thresholdOnTest).toEqual({ coverage: 0.5, accuracy: 1 });
    expect(kind.byOrigin).toEqual({ authored: 4 });
  });
});
