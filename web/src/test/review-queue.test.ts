import { describe, it, expect, beforeEach } from "vitest";
import { world } from "./world";
import * as repo from "@/ledger/repo";
import type { Flag } from "@/domain/types";

let w: Awaited<ReturnType<typeof world>>;

beforeEach(async () => {
  w = await world();
});

describe("reviewQueue", () => {
  it("returns integrity flags first, then low confidence, then grades needing review", async () => {
    // 1. Evidence with integrity flag
    await repo.upsertEvidence(w.db, {
      assetId: "ev-integ",
      projectId: "p1",
      siteId: "s1",
      source: "bulk_import",
      status: "needs_review",
      statusReason: "Possible location mismatch",
      secureUrl: "https://example.com/ev-integ.jpg",
      width: 800,
      height: 600,
      flags: [
        {
          kind: "possible_different_location",
          detail: "Could not align baseline",
          relatedAssetIds: ["b1"],
        },
      ] as Flag[],
    });

    // 2. Evidence with low confidence (no integrity flag)
    await repo.upsertEvidence(w.db, {
      assetId: "ev-lowconf",
      projectId: "p1",
      siteId: "s1",
      source: "bulk_import",
      status: "needs_review",
      statusReason: "Low decision confidence",
      secureUrl: "https://example.com/ev-lowconf.jpg",
      width: 800,
      height: 600,
      flags: [] as Flag[],
    });

    // 3. Assessment needing review
    await repo.insertAssessment(w.db, {
      siteId: "s1",
      timepoint: "2026-09-28",
      grade: 2,
      status: "needs_review",
    });

    const queue = await repo.reviewQueue(w.db, "p1");

    expect(queue).toHaveLength(3);

    // Group 1: Integrity
    expect(queue[0]).toMatchObject({
      kind: "evidence",
      group: "integrity",
      row: { assetId: "ev-integ" },
    });

    // Group 2: Low confidence
    expect(queue[1]).toMatchObject({
      kind: "evidence",
      group: "low_confidence",
      row: { assetId: "ev-lowconf" },
    });

    // Group 3: Grade
    expect(queue[2]).toMatchObject({
      kind: "grade",
      assessment: { siteId: "s1", timepoint: "2026-09-28", grade: 2 },
      site: { id: "s1" },
    });
  });
});
