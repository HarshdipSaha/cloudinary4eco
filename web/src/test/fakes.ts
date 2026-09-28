import type { Decision, DecisionKind, MediaAnalysis, RegistrationResult, Relevance, WitnessAgreement } from "@/domain/types";
import type { MediaPort } from "@/ports/media";
import { DecisionsUnavailable, type DecisionsPort } from "@/ports/decisions";
import { RegistrationUnavailable, type RegistrationPort } from "@/ports/registration";
import type { DrafterPort } from "@/ports/drafter";
import { WeatherUnavailable, type DailyWeather, type WeatherPort } from "@/ports/weather";

export function analysis(assetId: string, over: Partial<MediaAnalysis> = {}): MediaAnalysis {
  return {
    assetId,
    secureUrl: `https://res.cloudinary.com/demo/image/upload/${assetId}`,
    width: 1600,
    height: 1200,
    caption: "young saplings planted in rows on dry soil",
    tags: ["plant", "soil"],
    ocrText: null,
    capturedAt: "2026-09-28T10:00:00+05:30",
    gps: { lat: 28.6, lon: 77.2 },
    phash: null,
    faceCount: 0,
    missingSignals: [],
    ...over,
  };
}

export class FakeMedia implements MediaPort {
  contexts: Record<string, Record<string, string>> = {};
  searchResult: string[] = [];
  constructor(public analyses: Record<string, MediaAnalysis> = {}) {}
  add(a: MediaAnalysis) {
    this.analyses[a.assetId] = a;
    return a.assetId;
  }
  async analyze(id: string) {
    const a = this.analyses[id];
    if (!a) throw new Error(`FakeMedia: no analysis for ${id}`);
    return structuredClone(a);
  }
  signUpload() {
    return { cloudName: "demo", apiKey: "k", timestamp: 1, signature: "sig", params: {} };
  }
  async setContext(id: string, ctx: Record<string, string>) {
    this.contexts[id] = { ...this.contexts[id], ...ctx };
  }
  async searchIds() {
    return this.searchResult;
  }
}

export class FakeDecisions implements DecisionsPort {
  unavailable = false;
  site: Record<string, string> = {};
  relevance: Record<string, Relevance> = {};
  confidence: Record<string, number> = {};
  grade = { level: 3, p: 0.86 };
  agreement: WitnessAgreement = "corroborates";
  supports: (sentence: string) => boolean = () => true;
  relevant: (text: string) => number = () => 0.9;
  calls = { triage: 0, grade: 0, agreement: 0, sentences: 0, search: 0 };

  private d<T>(kind: DecisionKind, subjectId: string, answer: T, confidence = 0.95, probabilities: Record<string, number> = {}): Decision<T> {
    return { kind, subjectId, answer, probabilities, confidence, model: "jev-fake", latencyMs: 90, inputTokens: 120 };
  }
  private gate() {
    if (this.unavailable) throw new DecisionsUnavailable("Jev unavailable (fake)");
  }

  async triage(inputs: Parameters<DecisionsPort["triage"]>[0]) {
    this.calls.triage++;
    this.gate();
    return inputs.map((t) => {
      const c = this.confidence[t.assetId] ?? 0.95;
      return {
        assetId: t.assetId,
        site: t.candidateSites.length ? this.d("triage_site", t.assetId, this.site[t.assetId] ?? t.candidateSites[0]!.id, c) : null,
        relevance: this.d("triage_relevance", t.assetId, this.relevance[t.assetId] ?? "evidence", c),
        activity: this.d("triage_activity", t.assetId, "planting", c),
      };
    });
  }
  async gradeSite(g: Parameters<DecisionsPort["gradeSite"]>[0]) {
    this.calls.grade++;
    this.gate();
    return this.d("src_grade", `${g.siteId}@${g.timepoint}`, this.grade.level, this.grade.p, { [String(this.grade.level)]: this.grade.p });
  }
  async witnessAgreement(a: Parameters<DecisionsPort["witnessAgreement"]>[0]) {
    this.calls.agreement++;
    this.gate();
    return this.d("witness_agreement", a.siteId, this.agreement, 0.9, { [this.agreement]: 0.9 });
  }
  async sentenceSupport(items: Parameters<DecisionsPort["sentenceSupport"]>[0]) {
    this.calls.sentences++;
    this.gate();
    return items.map((it) => {
      const ok = this.supports(it.sentence);
      return this.d("sentence_support", it.id, ok, 0.9, { yes: ok ? 0.9 : 0.1, no: ok ? 0.1 : 0.9 });
    });
  }
  async searchRelevance(_q: string, cards: { id: string; text: string }[]) {
    this.calls.search++;
    this.gate();
    return cards.map((c) => {
      const p = this.relevant(c.text);
      return this.d("search_relevance", c.id, p, Math.max(p, 1 - p), { yes: p, no: 1 - p });
    });
  }
}

export const goodRegistration = (id: string): RegistrationResult => ({
  quality: "good",
  inliers: 180,
  inlierRatio: 0.62,
  homography: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  alignedAssetId: `saakshya/derived/${id}_aligned`,
  differenceAssetId: `saakshya/derived/${id}_difference`,
  inlierPoints: [[0.2, 0.3], [0.5, 0.5]],
  metrics: { vegetationFractionBefore: 0.08, vegetationFractionAfter: 0.31, vegetationDelta: 0.23, changedAreaFraction: 0.27, brightnessShift: 3.1 },
});

export class FakeRegistration implements RegistrationPort {
  unavailable = false;
  results: Record<string, RegistrationResult> = {};
  calls: string[] = [];
  async register(i: Parameters<RegistrationPort["register"]>[0]) {
    this.calls.push(i.followupAssetId);
    if (this.unavailable) throw new RegistrationUnavailable("CV worker down (fake)");
    return this.results[i.followupAssetId] ?? goodRegistration(i.followupAssetId);
  }
}

export class FakeWeather implements WeatherPort {
  unavailable = false;
  byDate: Record<string, DailyWeather> = {};
  calls: { lat: number; lon: number; date: string }[] = [];
  async historical(i: Parameters<WeatherPort["historical"]>[0]) {
    this.calls.push(i);
    if (this.unavailable) throw new WeatherUnavailable("Open-Meteo down (fake)");
    return this.byDate[i.date] ?? null;
  }
}

export class FakeDrafter implements DrafterPort {
  constructor(public text: string) {}
  async draft() {
    return this.text;
  }
}
