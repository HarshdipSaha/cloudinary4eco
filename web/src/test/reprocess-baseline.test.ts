import { beforeEach, describe, expect, it } from "vitest";
import { world } from "./world";
import { analysis } from "./fakes";
import * as repo from "@/ledger/repo";
import { reprocessEvidenceAfterBaseline } from "@/pipeline/reprocess-baseline";

let w: Awaited<ReturnType<typeof world>>;

beforeEach(async () => {
  w = await world();
});

describe("reprocessEvidenceAfterBaseline", () => {
  it("registers an already-uploaded follow-up against the newly set baseline", async () => {
    const followup = analysis("followup-s1", { phash: "2222222222222222" });
    w.media.add(followup);
    await repo.upsertEvidence(w.db, {
      assetId: followup.assetId,
      projectId: "p1",
      siteId: "s1",
      source: "bulk_import",
      status: "accepted",
      secureUrl: followup.secureUrl,
      width: followup.width,
      height: followup.height,
      caption: followup.caption,
      tags: followup.tags,
      capturedAt: new Date(followup.capturedAt!),
      timepoint: "2026-09-28",
      lat: 28.6,
      lon: 77.2,
      phash: followup.phash,
      missingSignals: [],
      flags: [],
    });

    const result = await reprocessEvidenceAfterBaseline(w.deps, "s1");

    expect(result.reprocessed).toBe(1);
    expect(await repo.derivativeFor(w.db, "followup-s1")).toMatchObject({ baselineAssetId: "base-s1", quality: "good" });
    expect(await repo.assessmentsForSite(w.db, "s1")).toHaveLength(1);
  });
});
