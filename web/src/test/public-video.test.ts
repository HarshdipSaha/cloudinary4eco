import { describe, expect, it } from "vitest";
import { frameOffsets, parsePublicVideoRequest, sanitizeVideoFrame, validatePublicVideoUrl } from "@/pipeline/public-video";
import type { MediaAnalysis } from "@/domain/types";

const analysis: MediaAnalysis = {
  assetId: "frame-1",
  secureUrl: "https://res.cloudinary.com/demo/image/upload/frame-1.jpg",
  width: 1280,
  height: 720,
  caption: null,
  tags: [],
  ocrText: null,
  capturedAt: "2026-09-29T10:00:00Z",
  gps: { lat: 28.6, lon: 77.2 },
  phash: "abc123",
  faceCount: null,
  missingSignals: [],
};

describe("public video evidence", () => {
  it("selects exactly three deterministic frame offsets", () => {
    expect(frameOffsets(100)).toEqual([10, 50, 90]);
  });

  it("rejects unusable durations", () => {
    expect(() => frameOffsets(0)).toThrow(/duration/i);
  });

  it("sanitizes camera metadata from extracted frames", () => {
    expect(sanitizeVideoFrame(analysis)).toMatchObject({ capturedAt: null, gps: null });
    expect(sanitizeVideoFrame(analysis).missingSignals).toEqual(["capture_time", "gps"]);
  });

  it("accepts only HTTPS public media URLs from the configured provider", () => {
    expect(validatePublicVideoUrl("https://res.cloudinary.com/demo/video/upload/dog.mp4")).toBe(
      "https://res.cloudinary.com/demo/video/upload/dog.mp4"
    );
    expect(() => validatePublicVideoUrl("http://res.cloudinary.com/demo/video/upload/dog.mp4")).toThrow(/https/i);
    expect(() => validatePublicVideoUrl("https://localhost/video.mp4")).toThrow(/public|provider/i);
    expect(() => validatePublicVideoUrl("https://example.com/video.mp4")).toThrow(/provider/i);
  });

  it("requires a site and permission note for API imports", () => {
    expect(parsePublicVideoRequest({
      projectId: "p1",
      siteId: "s1",
      sourceUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
      permissionNote: "I have permission",
    })).toMatchObject({ projectId: "p1", siteId: "s1" });
    expect(() => parsePublicVideoRequest({ projectId: "p1", siteId: "s1", sourceUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4", permissionNote: "" })).toThrow(/permission/i);
  });
});
