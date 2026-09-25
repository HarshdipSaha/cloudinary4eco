import { describe, it, expect } from "vitest";
import { decideStatus } from "@/domain/status";
import type { Decision, Relevance } from "@/domain/types";

const d = <T,>(answer: T, confidence = 0.95): Decision<T> => ({
  kind: "triage_relevance", subjectId: "a", answer, probabilities: {}, confidence, model: "m", latencyMs: 1, inputTokens: 1,
});
const ok = { relevance: d<Relevance>("evidence"), site: d("s1"), siteId: "s1", flags: [], registration: { quality: "good" as const } };

describe("decideStatus", () => {
  it("accepts confident, clean, well-registered evidence", () => {
    expect(decideStatus(ok)).toEqual({ status: "accepted", reason: null });
  });
  it("sets aside confident non-evidence with the reason", () => {
    expect(decideStatus({ ...ok, relevance: d<Relevance>("screenshot_or_meme") })).toEqual({ status: "set_aside", reason: "Not field evidence: screenshot_or_meme" });
  });
  it("sends integrity flags to review", () => {
    const r = decideStatus({ ...ok, flags: [{ kind: "recycled_image", detail: "x", relatedAssetIds: ["o"] }] });
    expect(r.status).toBe("needs_review");
    expect(r.reason).toContain("recycled_image");
  });
  it("sets aside same-visit duplicates", () => {
    expect(decideStatus({ ...ok, flags: [{ kind: "duplicate", detail: "x", relatedAssetIds: ["b"] }] }).status).toBe("set_aside");
  });
  it("does not treat location_inferred as integrity", () => {
    expect(decideStatus({ ...ok, flags: [{ kind: "location_inferred", detail: "x", relatedAssetIds: [] }] }).status).toBe("accepted");
  });
  it("reviews low confidence, missing site, weak or failed registration", () => {
    expect(decideStatus({ ...ok, relevance: d<Relevance>("evidence", 0.6) }).status).toBe("needs_review");
    expect(decideStatus({ ...ok, siteId: null, site: d("none") }).status).toBe("needs_review");
    expect(decideStatus({ ...ok, registration: { quality: "weak" } }).status).toBe("needs_review");
    expect(decideStatus({ ...ok, registration: { quality: "failed" } }).status).toBe("needs_review");
  });
  it("accepts evidence with no baseline to register against yet", () => {
    expect(decideStatus({ ...ok, registration: null }).status).toBe("accepted");
  });
});
