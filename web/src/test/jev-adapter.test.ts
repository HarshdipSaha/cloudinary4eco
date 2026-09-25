import { describe, it, expect } from "vitest";
import { jevDecisions } from "@/adapters/jev/client";
import { DecisionsUnavailable, type TriageInput } from "@/ports/decisions";

function fakeFetch(handler: (body: any) => any) {
  return (async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    return new Response(JSON.stringify(handler(body)), { status: 200, headers: { "content-type": "application/json" } });
  }) as any;
}

const input = (i: number): TriageInput => ({
  assetId: `a${i}`, projectType: "plantation",
  card: { caption: "saplings", tags: [], ocrText: null, comment: null, filename: null, capturedAt: null },
  candidateSites: [{ id: "s1", name: "Plot B", description: "", distanceM: 20 }],
});

describe("jevDecisions.triage", () => {
  it("asks site/relevance/activity per asset in batches and maps typed answers", async () => {
    const seen: string[][] = [];
    const client = jevDecisions({
      apiKey: "k", model: "jev-test",
      fetch: fakeFetch((body) => {
        const keys = Object.keys(body.questions);
        seen.push(keys);
        const answers: Record<string, unknown> = {};
        for (const k of keys) {
          if (k.endsWith("_site")) answers[k] = { type: "choice", choice: "s1", confidence: 0.91, probabilities: { s1: 0.91, none: 0.09 } };
          if (k.endsWith("_relevance")) answers[k] = { type: "choice", choice: "evidence", confidence: 0.97, probabilities: { evidence: 0.97 } };
          if (k.endsWith("_activity")) answers[k] = { type: "choice", choice: "planting", confidence: 0.8, probabilities: { planting: 0.8 } };
        }
        return { model: "jev-test", answers, usage: { input_tokens: 400, output_tokens: 0 } };
      }),
    });
    const out = await client.triage(Array.from({ length: 10 }, (_, i) => input(i)));
    expect(seen).toHaveLength(2); // 8 + 2
    expect(seen[0]).toContain("a0_site");
    expect(out).toHaveLength(10);
    expect(out[9]!.site?.answer).toBe("s1");
    expect(out[9]!.relevance).toMatchObject({ answer: "evidence", confidence: 0.97, model: "jev-test", kind: "triage_relevance" });
    expect(out[0]!.relevance.inputTokens).toBe(50); // 400 tokens shared across 8 assets
    expect(out[0]!.relevance.state).toMatchObject({ assets: expect.any(Array) }); // receipt: the exact state sent
    expect(out[0]!.relevance.question).toMatchObject({ type: "choice" });
  });

  it("skips the site question when the site is known", async () => {
    const client = jevDecisions({
      apiKey: "k", model: "m",
      fetch: fakeFetch((body) => {
        expect(Object.keys(body.questions).some((k) => k.endsWith("_site"))).toBe(false);
        return { model: "m", usage: { input_tokens: 1, output_tokens: 0 }, answers: {
          a0_relevance: { type: "choice", choice: "evidence", confidence: 0.9, probabilities: {} },
          a0_activity: { type: "choice", choice: "other", confidence: 0.9, probabilities: {} },
        } };
      }),
    });
    const [r] = await client.triage([{ ...input(0), candidateSites: [] }]);
    expect(r!.site).toBeNull();
  });

  it("throws DecisionsUnavailable when the API is unreachable", async () => {
    const client = jevDecisions({ apiKey: "k", model: "m", fetch: (async () => { throw new TypeError("fetch failed"); }) as any, maxRetries: 0 });
    await expect(client.triage([input(0)])).rejects.toBeInstanceOf(DecisionsUnavailable);
  });
});

describe("jevDecisions.gradeSite", () => {
  it("returns the most probable level as the answer", async () => {
    const client = jevDecisions({
      apiKey: "k", model: "m",
      fetch: fakeFetch(() => ({ model: "m", usage: { input_tokens: 10, output_tokens: 0 }, answers: {
        grade: { type: "score", score: 2.3, confidence: 0.7, probabilities: { "0": 0.02, "1": 0.1, "2": 0.45, "3": 0.43 }, legend: {} },
      } })),
    });
    const d = await client.gradeSite({ siteId: "s1", timepoint: "2026-10-01", projectType: "plantation", baselineCaption: "bare", followupCaption: "saplings", metrics: null, registrationQuality: "good", daysSinceBaseline: 10 });
    expect(d.answer).toBe(2);
    expect(d.probabilities["2"]).toBe(0.45);
  });
});
