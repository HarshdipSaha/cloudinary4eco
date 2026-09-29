import type { MediaAnalysis } from "@/domain/types";
import { nanoid } from "nanoid";
import { z } from "zod";
import * as repo from "@/ledger/repo";
import { ingestBatch, type PipelineDeps, type PipelineEvent } from "@/pipeline/ingest";

const FRAME_RATIOS = [0.1, 0.5, 0.9] as const;
const DEFAULT_VIDEO_HOST = "res.cloudinary.com";

export function frameOffsets(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("Video duration must be greater than zero.");
  }
  return FRAME_RATIOS.map((ratio) => Number((durationSeconds * ratio).toFixed(3)));
}

export function sanitizeVideoFrame(analysis: MediaAnalysis): MediaAnalysis {
  return {
    ...analysis,
    capturedAt: null,
    gps: null,
    missingSignals: [...new Set([...analysis.missingSignals, "capture_time", "gps"])],
  };
}

function allowedVideoHosts() {
  return new Set(
    (process.env.PUBLIC_VIDEO_ALLOWED_HOSTS ?? DEFAULT_VIDEO_HOST)
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function validatePublicVideoUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Public video URL is invalid.");
  }
  if (url.protocol !== "https:") throw new Error("Public video URL must use HTTPS.");
  if (url.username || url.password) throw new Error("Public video URL cannot contain credentials.");
  if (url.hostname === "localhost" || /^127\.|^10\.|^192\.168\./.test(url.hostname)) {
    throw new Error("Public video URL must use an approved public provider.");
  }
  if (!allowedVideoHosts().has(url.hostname.toLowerCase())) {
    throw new Error("Public video URL must use an approved provider.");
  }
  if (!url.pathname.includes("/video/upload/")) {
    throw new Error("Public video URL must be a direct video asset URL.");
  }
  return url.toString();
}

export const PUBLIC_VIDEO_MIN_DURATION_SECONDS = 3;
export const PUBLIC_VIDEO_MAX_DURATION_SECONDS = 600;

const PublicVideoRequest = z.object({
  projectId: z.string().min(1),
  siteId: z.string().min(1),
  sourceUrl: z.string().url().max(2000),
  permissionNote: z.string().trim().min(3).max(500),
});

export function parsePublicVideoRequest(input: unknown) {
  const parsed = PublicVideoRequest.parse(input);
  return { ...parsed, sourceUrl: validatePublicVideoUrl(parsed.sourceUrl) };
}

export type PublicVideoEvent =
  | { type: "video_validated"; importId: string }
  | { type: "video_imported"; importId: string; durationSeconds: number }
  | { type: "video_frame"; importId: string; frameSecond: number; assetId: string }
  | { type: "video_complete"; importId: string; frameAssetIds: string[] }
  | { type: "video_failed"; importId: string; reason: string };

export async function importPublicVideoEvidence(
  deps: PipelineDeps,
  input: { projectId: string; siteId: string; sourceUrl: string; permissionNote: string },
  emit: (event: PublicVideoEvent | PipelineEvent) => void = () => {}
) {
  const sourceUrl = validatePublicVideoUrl(input.sourceUrl);
  if (!input.permissionNote.trim()) throw new Error("A permission note is required for a public video.");
  const site = await repo.site(deps.db, input.siteId);
  if (!site || site.projectId !== input.projectId) throw new Error("The selected site is not part of this project.");

  const importId = `pvi_${nanoid(12)}`;
  emit({ type: "video_validated", importId });
  const folder = `saakshya/${input.projectId}/public-video/${importId}`;
  let remoteVideoAssetId: string | null = null;
  try {
    const remote = await deps.media.importPublicVideo({ sourceUrl, folder });
    remoteVideoAssetId = remote.assetId;
    if (remote.durationSeconds < PUBLIC_VIDEO_MIN_DURATION_SECONDS || remote.durationSeconds > PUBLIC_VIDEO_MAX_DURATION_SECONDS) {
      throw new Error(`Video duration must be between ${PUBLIC_VIDEO_MIN_DURATION_SECONDS} and ${PUBLIC_VIDEO_MAX_DURATION_SECONDS} seconds.`);
    }
    await repo.createPublicVideoImport(deps.db, {
      id: importId,
      projectId: input.projectId,
      siteId: input.siteId,
      sourceUrl,
      permissionNote: input.permissionNote.trim(),
      remoteVideoAssetId: remote.assetId,
      durationSeconds: remote.durationSeconds,
      status: "processing",
      statusReason: null,
    });
    emit({ type: "video_imported", importId, durationSeconds: remote.durationSeconds });

    const frameAnalyses = new Map<string, MediaAnalysis>();
    const frameMedia: PipelineDeps["media"] = {
      ...deps.media,
      analyze: async (assetId: string) => frameAnalyses.get(assetId) ?? deps.media.analyze(assetId),
    };
    const frameAssetIds: string[] = [];
    for (const frameSecond of frameOffsets(remote.durationSeconds)) {
      const raw = await deps.media.renderVideoFrame({ videoAssetId: remote.assetId, atSecond: frameSecond, folder });
      const frame = sanitizeVideoFrame(raw);
      frameAnalyses.set(frame.assetId, frame);
      frameAssetIds.push(frame.assetId);
      emit({ type: "video_frame", importId, frameSecond, assetId: frame.assetId });
      await ingestBatch(
        { ...deps, media: frameMedia },
        {
          projectId: input.projectId,
          siteId: input.siteId,
          source: "web_video",
          assetIds: [frame.assetId],
          batchId: `${importId}_${String(frameSecond).replaceAll(".", "_")}`,
          meta: {
            [frame.assetId]: {
              filename: `public-video-${frameSecond}s.jpg`,
              comment: `Frame extracted from submitted public video at ${frameSecond}s: ${sourceUrl}`,
            },
          },
        },
        emit
      );
      await repo.attachVideoFrame(deps.db, frame.assetId, importId, frameSecond);
    }
    await repo.updatePublicVideoImport(deps.db, importId, { status: "complete", statusReason: null });
    emit({ type: "video_complete", importId, frameAssetIds });
    return { importId, frameAssetIds };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (await repo.publicVideoImport(deps.db, importId)) {
      await repo.updatePublicVideoImport(deps.db, importId, { status: "failed", statusReason: reason });
    }
    emit({ type: "video_failed", importId, reason });
    throw error;
  }
}
