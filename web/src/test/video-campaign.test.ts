import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { world } from "./world";
import { seedVideo } from "./video-seed";
import * as repo from "@/ledger/repo";
import * as t from "@/ledger/schema";
import { campaignDraft, composeVideoCampaign, isUsableFrame, videoFacts } from "@/pipeline/video-campaign";

let w: Awaited<ReturnType<typeof world>>;
beforeEach(async () => {
  w = await world();
  await seedVideo(w); // seconds 90 (people_only), 10, 50 — all needs_review
});
const accept = (assetId: string) => w.db.update(t.evidence).set({ status: "accepted" }).where(eq(t.evidence.assetId, assetId));

describe("videoFacts", () => {
  const rows = [
    { assetId: "a", frameSecond: 10, status: "accepted", relevance: "evidence", activity: "planting" },
    { assetId: "b", frameSecond: 50, status: "needs_review", relevance: "people_only", activity: "other" },
  ];
  it("states the sampling, each frame, and the verification gap as numbered facts", () => {
    const facts = videoFacts({ siteName: "Plot B", durationSeconds: 100, frames: rows });
    expect(facts.map((f) => f.id)).toEqual(["F1", "F2", "F3", "F4"]);
    expect(facts[1]!.text).toBe("The frame at 0:10.0 was classified as field evidence showing planting; its review status is accepted.");
    expect(facts[2]!.text).toMatch(/0:50\.0 was classified as people only, not field evidence/);
    expect(facts[3]!.text).toBe("Capture time and GPS location of the video are not verified.");
  });
  it("drafts sentences that cite only existing facts", () => {
    const facts = videoFacts({ siteName: "Plot B", durationSeconds: 100, frames: rows });
    const draft = campaignDraft(facts, rows, "Plot B");
    const ids = new Set(facts.map((f) => f.id));
    expect(draft[0]!.text).toBe("Footage from Plot B shows planting at 0:10.0.");
    expect(draft[1]!.text).toBe("1 of 2 sampled frames were accepted as field evidence.");
    expect(draft.every((s) => s.factIds.length && s.factIds.every((f) => ids.has(f)))).toBe(true);
  });
  it("only accepted evidence frames are usable", () => {
    expect(rows.map(isUsableFrame)).toEqual([true, false]);
  });
});

describe("composeVideoCampaign", () => {
  it("refuses until a human has accepted an evidence frame", async () => {
    await expect(composeVideoCampaign(w.deps, "pvi_test")).rejects.toThrow(/Accept at least one/);
  });

  it("builds a card from accepted evidence frames and keeps Jev-supported sentences", async () => {
    await accept("pvi_test/frame-10");
    await accept("pvi_test/frame-90"); // accepted but people_only: must not appear on the card
    w.decisions.supports = (s) => !s.startsWith("1 of");
    const id = await composeVideoCampaign(w.deps, "pvi_test");
    const campaign = await repo.latestVideoCampaign(w.db, "pvi_test");
    expect(campaign?.id).toBe(id);
    expect(campaign?.frameAssetIds).toEqual(["pvi_test/frame-10"]);
    expect(campaign?.imageUrl.endsWith("/pvi_test/frame-10")).toBe(true);
    expect(campaign?.sentences.map((s) => s.status)).toEqual(["kept", "struck", "kept"]);
    expect(campaign?.sentences[1]!.reason).toMatch(/Not supported/);
    expect(campaign?.sentences.every((s) => s.decisionId !== null)).toBe(true);
  });

  it("marks every sentence pending when Jev is unavailable and keeps none", async () => {
    await accept("pvi_test/frame-10");
    w.decisions.unavailable = true;
    await composeVideoCampaign(w.deps, "pvi_test");
    const campaign = await repo.latestVideoCampaign(w.db, "pvi_test");
    expect(campaign?.sentences.map((s) => s.status)).toEqual(["pending", "pending", "pending"]);
  });

  it("refuses an import that has not completed", async () => {
    await accept("pvi_test/frame-10");
    await repo.updatePublicVideoImport(w.db, "pvi_test", { status: "processing" });
    await expect(composeVideoCampaign(w.deps, "pvi_test")).rejects.toThrow(/not finished/);
  });
});
