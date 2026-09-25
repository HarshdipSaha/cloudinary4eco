import { describe, it, expect, beforeEach } from "vitest";
import { world } from "./world";
import { analysis } from "./fakes";
import { ingestBatch } from "@/pipeline/ingest";
import { assessSite } from "@/pipeline/assess";
import * as repo from "@/ledger/repo";

let w: Awaited<ReturnType<typeof world>>;
beforeEach(async () => {
  w = await world();
});
const ingest = (ids: string[]) =>
  ingestBatch(w.deps, { projectId: "p1", source: "bulk_import", assetIds: ids, batchId: `b-${ids.join()}` });

describe("assessSite", () => {
  it("grades from the best-registered follow-up of the day and stores the decision", async () => {
    w.media.add(analysis("g1"));
    w.media.add(analysis("g2", { capturedAt: "2026-09-28T16:00:00+05:30" }));
    w.registration.results.g1 = { ...(await import("./fakes")).goodRegistration("g1"), inliers: 90 };
    await ingest(["g1", "g2"]);
    const [a] = await repo.assessmentsForSite(w.db, "s1");
    const d = await repo.derivativeFor(w.db, "g2");
    expect(a?.derivativeId).toBe(d?.id); // g2 has 180 inliers > 90
    expect(a).toMatchObject({ grade: 3, status: "accepted" });
  });

  it("needs review when the top grade probability is low", async () => {
    w.decisions.grade = { level: 2, p: 0.5 };
    w.media.add(analysis("g3"));
    await ingest(["g3"]);
    expect((await repo.assessmentsForSite(w.db, "s1"))[0]).toMatchObject({ grade: 2, status: "needs_review" });
  });

  it("stores a pending assessment, not a grade, when Jev is down at grading time", async () => {
    w.media.add(analysis("g4"));
    await ingest(["g4"]);
    w.decisions.unavailable = true;
    const r = await assessSite(w.deps, "s1", "2026-09-28");
    expect(r).toMatchObject({ grade: null, status: "pending" });
  });

  it("returns null when there is nothing registered to grade", async () => {
    expect(await assessSite(w.deps, "s2", "2026-09-28")).toBeNull();
  });
});
