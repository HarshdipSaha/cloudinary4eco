import { describe, expect, it } from "vitest";
import { world } from "./world";
import { seedVideo } from "./video-seed";
import * as repo from "@/ledger/repo";

describe("video rubric ledger", () => {
  it("returns frames in time order with the latest decision per kind", async () => {
    const w = await world();
    await seedVideo(w);
    const rubric = await repo.videoRubric(w.db, "pvi_test");
    expect(rubric?.site?.name).toBe("Plot B");
    expect(rubric?.observations.map((o) => o.frame.frameSecond)).toEqual([10, 50, 90]);
    const relevance = rubric!.observations[0]!.decisions.filter((d) => d.kind === "triage_relevance");
    expect(relevance).toHaveLength(1);
    expect(relevance[0]!.confidence).toBe(0.93);
    expect(rubric?.campaign).toBeNull();
  });

  it("returns null for an unknown import", async () => {
    const w = await world();
    expect(await repo.videoRubric(w.db, "missing")).toBeNull();
  });

  it("stores campaigns and deletes them with their import", async () => {
    const w = await world();
    const [frame] = await seedVideo(w);
    await repo.insertVideoCampaign(w.db, {
      id: "vc_1", importId: "pvi_test", frameAssetIds: [frame!], imageUrl: "https://example.test/card",
      facts: [{ id: "F1", text: "fact", evidenceIds: [frame!] }],
      sentences: [{ text: "s", factIds: ["F1"], status: "kept", support: 0.9, decisionId: null, reason: null }],
    });
    expect((await repo.latestVideoCampaign(w.db, "pvi_test"))?.id).toBe("vc_1");
    await repo.deletePublicVideoImportRows(w.db, "pvi_test");
    expect(await repo.latestVideoCampaign(w.db, "pvi_test")).toBeNull();
    expect(await repo.publicVideoImport(w.db, "pvi_test")).toBeNull();
  });
});
