import { describe, it, expect, beforeEach } from "vitest";
import { world } from "./world";
import { analysis, FakeDrafter } from "./fakes";
import { ingestBatch } from "@/pipeline/ingest";
import { buildDigest } from "@/reports/digest";
import { composeReport } from "@/reports/compose";
import * as repo from "@/ledger/repo";

let w: Awaited<ReturnType<typeof world>>;
beforeEach(async () => {
  w = await world();
  w.media.add(analysis("r1"));
  await ingestBatch(w.deps, { projectId: "p1", source: "implementer", assetIds: ["r1"], batchId: "b1" });
});

describe("buildDigest", () => {
  it("states grade, measurements and counts as numbered facts with evidence ids", async () => {
    const facts = await buildDigest(w.db, "p1", "2026-09-20", "2026-10-10");
    const text = facts.map((f) => `${f.id} ${f.text}`).join("\n");
    expect(text).toMatch(/F\d+ Plot B: Site Response grade on 2026-09-28 is "Established"/);
    expect(text).toMatch(/vegetation cover changed from 8% to 31%/);
    expect(facts.find((f) => f.text.includes("Established"))?.evidenceIds).toEqual(
      expect.arrayContaining(["r1", "saakshya/derived/r1_aligned"])
    );
  });
});

describe("composeReport", () => {
  it("keeps supported sentences and strikes uncited, bogus-cited and unsupported ones", async () => {
    const facts = await buildDigest(w.db, "p1", "2026-09-20", "2026-10-10");
    const grade = facts.find((f) => f.text.includes("Established"))!.id;
    w.decisions.supports = (s) => !s.includes("1,200");
    const drafter = new FakeDrafter(`Findings
Plot B is established. [${grade}]
Over 1,200 saplings are thriving. [${grade}]
Everyone loves the project.
Water use fell sharply. [F99]
Impression
Early but real progress. [${grade}]`);
    const id = await composeReport(
      { ...w.deps, drafter },
      { projectId: "p1", periodStart: "2026-09-20", periodEnd: "2026-10-10" }
    );
    const rows = await repo.sentencesFor(w.db, id);
    expect(rows.map((r) => [r.text, r.status])).toEqual([
      ["Plot B is established.", "kept"],
      ["Over 1,200 saplings are thriving.", "struck"],
      ["Everyone loves the project.", "struck"],
      ["Water use fell sharply.", "struck"],
      ["Early but real progress.", "kept"],
    ]);
    expect(rows[2]!.reason).toBe("No receipt: the sentence cites no facts");
    expect(rows[3]!.reason).toBe("Cites a fact that does not exist");
    expect(rows[1]!.reason).toMatch(/Not supported/);
    expect((await repo.report(w.db, id))?.publicSlug).toMatch(/^[a-z0-9-]{8,}$/);
  });

  it("marks checkable sentences pending when Jev is down, and never keeps them", async () => {
    const facts = await buildDigest(w.db, "p1", "2026-09-20", "2026-10-10");
    w.decisions.unavailable = true;
    const id = await composeReport(
      { ...w.deps, drafter: new FakeDrafter(`Findings\nPlot B is established. [${facts[0]!.id}]`) },
      { projectId: "p1", periodStart: "2026-09-20", periodEnd: "2026-10-10" }
    );
    expect((await repo.sentencesFor(w.db, id))[0]).toMatchObject({ status: "pending" });
  });
});
