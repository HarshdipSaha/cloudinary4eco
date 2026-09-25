import { describe, it, expect } from "vitest";
import { world } from "./world";
import { analysis } from "./fakes";
import { ingestBatch } from "@/pipeline/ingest";
import * as repo from "@/ledger/repo";

describe("siteChart", () => {
  it("returns baseline, one timepoint per graded day with its best derivative, flags and agreement", async () => {
    const w = await world();
    w.media.add(analysis("sc1"));
    w.media.add(analysis("sc2", { capturedAt: "2026-10-02T10:00:00+05:30" }));
    await ingestBatch(w.deps, { projectId: "p1", source: "implementer", assetIds: ["sc1", "sc2"], batchId: "b1" });
    const c = await repo.siteChart(w.db, "s1");
    expect(c.baseline?.assetId).toBe("base-s1");
    expect(c.timepoints.map((t) => t.timepoint)).toEqual(["2026-09-28", "2026-10-02"]);
    expect(c.timepoints[0]).toMatchObject({
      grade: 3,
      status: "accepted",
      derivative: { alignedAssetId: "saakshya/derived/sc1_aligned" },
    });
    expect(c.timepoints[0]!.decision?.probabilities).toBeDefined();
    expect(c.counts).toMatchObject({ accepted: 3, needs_review: 0 }); // baseline + sc1 + sc2
  });
});
