import { describe, expect, it } from "vitest";
import { world } from "./world";
import * as repo from "@/ledger/repo";

describe("public video ledger", () => {
  it("keeps source and frame provenance together", async () => {
    const w = await world();
    await repo.createPublicVideoImport(w.db, {
      id: "video-1",
      projectId: "p1",
      siteId: "s1",
      sourceUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
      permissionNote: "Cloudinary demo video permitted for testing",
      remoteVideoAssetId: "video-asset-1",
      durationSeconds: 100,
      status: "complete",
      statusReason: null,
    });
    await repo.upsertEvidence(w.db, {
      assetId: "video-frame-1",
      projectId: "p1",
      siteId: "s1",
      videoImportId: "video-1",
      frameSecond: 10,
      source: "web_video",
      status: "needs_review",
      statusReason: "Frame extracted from submitted public video",
      secureUrl: "https://res.cloudinary.com/demo/image/upload/video-frame-1.jpg",
      width: 1280,
      height: 720,
      caption: null,
      tags: [],
      capturedAt: null,
      timepoint: null,
      lat: null,
      lon: null,
      phash: null,
      missingSignals: ["capture_time", "gps"],
      flags: [],
    });

    const frames = await repo.publicVideoFrames(w.db, "video-1");
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({ videoImportId: "video-1", frameSecond: 10, source: "web_video", lat: null, capturedAt: null });
  });

  it("deletes only rows belonging to an import", async () => {
    const w = await world();
    await repo.createPublicVideoImport(w.db, {
      id: "video-2",
      projectId: "p1",
      siteId: "s1",
      sourceUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
      permissionNote: "permitted",
      remoteVideoAssetId: "video-asset-2",
      durationSeconds: 10,
      status: "complete",
      statusReason: null,
    });
    await repo.deletePublicVideoImportRows(w.db, "video-2");
    expect(await repo.publicVideoImport(w.db, "video-2")).toBeNull();
  });
});
