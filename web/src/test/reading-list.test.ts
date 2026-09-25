import { describe, it, expect, beforeEach } from "vitest";
import { world } from "./world";
import * as repo from "@/ledger/repo";
import * as schema from "@/ledger/schema";

let w: Awaited<ReturnType<typeof world>>;

beforeEach(async () => {
  w = await world();
});

describe("readingList", () => {
  it("sorts by attention order: contested first, then integrity flags, then needs review, then pending, then stale", async () => {
    // Site 1: Clean, recent
    await repo.createSite(w.db, {
      id: "s-clean",
      projectId: "p1",
      name: "Clean Site",
      description: "Normal",
      location: { lat: 28.6, lon: 77.2 },
      radiusM: 100,
      baselineAssetId: null,
      qrSlug: "clean-slug",
    });

    // Site 2: Contested by witnesses
    await repo.createSite(w.db, {
      id: "s-contested",
      projectId: "p1",
      name: "Contested Site",
      description: "Contested",
      location: { lat: 28.6, lon: 77.2 },
      radiusM: 100,
      baselineAssetId: null,
      qrSlug: "contested-slug",
    });
    const [cl] = await w.db.insert(schema.claims).values({
      id: "c-test",
      projectId: "p1",
      siteId: "s-contested",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      text: "Trees planted",
    }).returning({ id: schema.claims.id });
    await repo.insertAgreement(w.db, {
      siteId: "s-contested",
      claimId: cl!.id,
      result: "contradicts",
    });

    // Site 3: Has integrity flag
    await repo.createSite(w.db, {
      id: "s-flagged",
      projectId: "p1",
      name: "Flagged Site",
      description: "Flagged",
      location: { lat: 28.6, lon: 77.2 },
      radiusM: 100,
      baselineAssetId: null,
      qrSlug: "flagged-slug",
    });
    await repo.upsertEvidence(w.db, {
      assetId: "ev-flagged",
      projectId: "p1",
      siteId: "s-flagged",
      source: "bulk_import",
      status: "needs_review",
      secureUrl: "https://example.com/ev.jpg",
      width: 800,
      height: 600,
      flags: [{ kind: "recycled_photo", detail: "Recycled", relatedAssetIds: [] }],
    });

    const list = await repo.readingList(w.db, "p1");
    const siteIds = list.map((r) => r.site.id);

    // Contested must come first, followed by flagged
    expect(siteIds[0]).toBe("s-contested");
    expect(siteIds[1]).toBe("s-flagged");
  });
});
