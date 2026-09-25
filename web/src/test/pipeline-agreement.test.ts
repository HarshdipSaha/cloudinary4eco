import { describe, it, expect, beforeEach } from "vitest";
import { world } from "./world";
import { analysis } from "./fakes";
import { ingestBatch } from "@/pipeline/ingest";
import * as repo from "@/ledger/repo";

let w: Awaited<ReturnType<typeof world>>;
beforeEach(async () => {
  w = await world();
});

describe("witness agreement", () => {
  it("is not computed without witness evidence", async () => {
    w.media.add(analysis("imp1"));
    await ingestBatch(w.deps, { projectId: "p1", source: "implementer", assetIds: ["imp1"], batchId: "b1" });
    expect(await repo.latestAgreement(w.db, "s1")).toBeNull();
    expect(w.decisions.calls.agreement).toBe(0);
  });

  it("records a contradiction when witnesses disagree with the claim", async () => {
    w.media.add(analysis("imp2"));
    await ingestBatch(w.deps, { projectId: "p1", source: "implementer", assetIds: ["imp2"], batchId: "b1" });
    w.decisions.agreement = "contradicts";
    w.media.add(analysis("wit2", { caption: "bare ground, a few dead sticks" }));
    await ingestBatch(w.deps, {
      projectId: "p1",
      source: "witness",
      assetIds: ["wit2"],
      batchId: "b2",
      siteId: "s1",
      meta: { wit2: { comment: "nothing growing here" } },
    });
    expect((await repo.latestAgreement(w.db, "s1"))?.result).toBe("contradicts");
  });

  it("stores a pending agreement when Jev is down", async () => {
    w.media.add(analysis("wit3"));
    await ingestBatch(w.deps, { projectId: "p1", source: "witness", assetIds: ["wit3"], batchId: "b3", siteId: "s1" });
    w.decisions.unavailable = true;
    const { updateAgreement } = await import("@/pipeline/agreement");
    await updateAgreement(w.deps, "s1", "2026-09-28");
    expect((await repo.latestAgreement(w.db, "s1"))?.result).toBeNull();
  });
});
