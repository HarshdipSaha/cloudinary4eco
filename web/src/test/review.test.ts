import { describe, it, expect, beforeEach } from "vitest";
import { world } from "./world";
import { analysis } from "./fakes";
import { ingestBatch } from "@/pipeline/ingest";
import { applyReview, signReading } from "@/pipeline/review";
import * as repo from "@/ledger/repo";

let w: Awaited<ReturnType<typeof world>>;
beforeEach(async () => {
  w = await world();
  w.media.add(analysis("rv1"));
  w.decisions.confidence.rv1 = 0.5;
  await ingestBatch(w.deps, { projectId: "p1", source: "bulk_import", assetIds: ["rv1"], batchId: "b1" });
});

describe("review", () => {
  it("accepts with an audit trail", async () => {
    await applyReview(w.deps, { assetId: "rv1", action: "accept", reason: "Checked on site visit", actor: "manager" });
    expect((await repo.evidenceItem(w.db, "rv1"))?.status).toBe("accepted");
  });
  it("requires a reason", async () => {
    await expect(applyReview(w.deps, { assetId: "rv1", action: "set_aside", reason: " ", actor: "m" })).rejects.toThrow(
      /reason/i
    );
  });
  it("reassigning a site re-runs the pipeline for that asset", async () => {
    await applyReview(w.deps, { assetId: "rv1", action: "assign_site", siteId: "s2", reason: "Wrong plot", actor: "m" });
    expect((await repo.evidenceItem(w.db, "rv1"))?.siteId).toBe("s2");
  });
  it("signing a reading records the human grade next to the model grade", async () => {
    await signReading(w.deps, {
      siteId: "s1",
      timepoint: "2026-09-28",
      grade: 2,
      reason: "Saplings sparse on the east side",
      actor: "m",
    });
    const last = (await repo.assessmentsForSite(w.db, "s1")).at(-1);
    expect(last).toMatchObject({ grade: 2, status: "signed" });
  });
});
