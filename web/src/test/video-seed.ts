import type { world } from "./world";
import * as repo from "@/ledger/repo";

export async function seedVideo(w: Awaited<ReturnType<typeof world>>, importId = "pvi_test") {
  await repo.createPublicVideoImport(w.db, {
    id: importId, projectId: "p1", siteId: "s1",
    sourceUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
    permissionNote: "Cloudinary demo video permitted for testing",
    remoteVideoAssetId: `${importId}/video`, durationSeconds: 100, status: "complete", statusReason: null,
  });
  const ids: string[] = [];
  for (const second of [90, 10, 50]) {
    const assetId = `${importId}/frame-${second}`;
    ids.push(assetId);
    await repo.upsertEvidence(w.db, {
      assetId, projectId: "p1", siteId: "s1", videoImportId: importId, frameSecond: second,
      source: "web_video", status: "needs_review", statusReason: "Frame extracted from submitted public video",
      secureUrl: `https://res.cloudinary.com/demo/image/upload/${assetId}`, width: 1280, height: 720,
      caption: null, tags: [], capturedAt: null, timepoint: null, lat: null, lon: null, phash: null,
      missingSignals: ["capture_time", "gps"], flags: [], relevance: second === 90 ? "people_only" : "evidence", activity: "planting",
    });
    for (const confidence of [0.6, 0.93]) {
      await repo.recordDecision(w.db, {
        kind: "triage_relevance", subjectId: assetId, answer: "evidence",
        probabilities: { evidence: confidence, people_only: 1 - confidence }, confidence,
        model: "jev-fake", latencyMs: 90, inputTokens: 100,
      });
    }
  }
  return ids;
}
