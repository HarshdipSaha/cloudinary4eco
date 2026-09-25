import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, type Db } from "@/ledger/db";
import * as repo from "@/ledger/repo";

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
  await repo.createProject(db, { id: "p1", name: "Yamuna Green", type: "plantation" });
  await repo.createSite(db, { id: "s1", projectId: "p1", name: "Plot B", description: "", location: { lat: 28.6, lon: 77.2 }, radiusM: 100, baselineAssetId: null, qrSlug: "plot-b" });
});

describe("ledger repo", () => {
  it("round-trips sites and finds by QR slug", async () => {
    expect((await repo.siteBySlug(db, "plot-b"))?.id).toBe("s1");
    expect(await repo.sitesForProject(db, "p1")).toHaveLength(1);
  });
  it("records baseline history when a baseline is set", async () => {
    await repo.setBaseline(db, "s1", "a1");
    await repo.setBaseline(db, "s1", "a2");
    expect((await repo.site(db, "s1"))?.baselineAssetId).toBe("a2");
    expect(await repo.baselineHistory(db, "s1")).toHaveLength(2);
  });
  it("stores decided and pending decisions and returns ids", async () => {
    const id = await repo.recordDecision(db, { kind: "src_grade", subjectId: "s1@2026-09-30", answer: 2, probabilities: { "2": 0.8 }, confidence: 0.8, model: "m", latencyMs: 90, inputTokens: 300 });
    const pid = await repo.recordPending(db, "src_grade", "s1@2026-10-01", "Jev unavailable");
    expect(id).toBeGreaterThan(0);
    expect((await repo.decision(db, pid))?.status).toBe("pending");
    const withState = await repo.recordDecision(db, { kind: "src_grade", subjectId: "s1@x", question: { type: "score" }, state: { a: 1 }, answer: 1, probabilities: {}, confidence: 0.9, model: "m", latencyMs: 1, inputTokens: 1 });
    expect(await repo.decision(db, withState)).toMatchObject({ state: { a: 1 }, stateHash: expect.stringMatching(/^[0-9a-f]{64}$/) });
  });
  it("sums measured Jev usage for a batch", async () => {
    await repo.recordDecision(db, { kind: "triage_relevance", subjectId: "a1", answer: "evidence", probabilities: {}, confidence: 0.9, model: "m", latencyMs: 100, inputTokens: 1000 });
    await repo.upsertEvidence(db, { assetId: "a1", projectId: "p1", batchId: "b1", source: "bulk_import", status: "pending", secureUrl: "u", width: 1, height: 1, tags: [], missingSignals: [], flags: [] });
    const u = await repo.batchUsage(db, "b1");
    expect(u.inputTokens).toBe(1000);
    expect(u.usd).toBeCloseTo(0.000042, 9);
  });
});
