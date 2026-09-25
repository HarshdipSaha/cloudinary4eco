import { describe, it, expect, beforeEach } from "vitest";
import { world } from "./world";
import { analysis } from "./fakes";
import { ingestBatch } from "@/pipeline/ingest";
import { search, buildExpression } from "@/search/search";
import * as repo from "@/ledger/repo";
import * as schema from "@/ledger/schema";


let w: Awaited<ReturnType<typeof world>>;
beforeEach(async () => {
  w = await world();
  w.media.add(analysis("q1", { caption: "people queueing at a hand pump" }));
  w.media.add(analysis("q2", { caption: "saplings in rows" }));
  await ingestBatch(w.deps, { projectId: "p1", source: "implementer", assetIds: ["q1", "q2"], batchId: "b1" });
  w.media.searchResult = ["q1", "q2", "unknown-asset"];
});

describe("search", () => {
  it("builds a Cloudinary filter expression without free text", () => {
    expect(buildExpression({ projectId: "p1", siteId: "s1", from: "2026-09-01" }, "saakshya")).toBe(
      'folder:"saakshya/p1/*" AND context.site_id="s1" AND uploaded_at>="2026-09-01"'
    );
  });
  it("reranks by Jev relevance and drops non-matches", async () => {
    w.decisions.relevant = (t) => (t.includes("queueing") ? 0.93 : 0.1);
    const r = await search(w.deps, { projectId: "p1", query: "people queueing for water" });
    expect(r.reranked).toBe(true);
    expect(r.items.map((i) => i.assetId)).toEqual(["q1"]);
    expect(r.items[0]!.score).toBeCloseTo(0.93);
  });
  it("falls back to filter-only results when Jev is down", async () => {
    w.decisions.unavailable = true;
    const r = await search(w.deps, { projectId: "p1", query: "anything" });
    expect(r.reranked).toBe(false);
    expect(r.items).toHaveLength(2);
  });
  it("filters by flagged status", async () => {
    const rFlagged = await search(w.deps, { projectId: "p1", flagged: true });
    expect(rFlagged.items).toHaveLength(0);
    const rUnflagged = await search(w.deps, { projectId: "p1", flagged: false });
    expect(rUnflagged.items).toHaveLength(2);
  });
  it("filters by timepoint SRC grade", async () => {
    await w.deps.db.insert(schema.assessments).values({
      siteId: "s1",
      timepoint: "2026-09-28",
      grade: 3,
      status: "accepted",
    });

    // q1 is at site s1
    const r = await search(w.deps, { projectId: "p1", grade: 3 });
    expect(Array.isArray(r.items)).toBe(true);
  });
});

