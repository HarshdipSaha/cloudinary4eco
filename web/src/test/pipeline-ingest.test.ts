import { describe, it, expect, beforeEach } from "vitest";
import { world } from "./world";
import { analysis } from "./fakes";
import { ingestBatch, type PipelineEvent } from "@/pipeline/ingest";
import * as repo from "@/ledger/repo";
import { DecisionsUnavailable } from "@/ports/decisions";

let w: Awaited<ReturnType<typeof world>>;
beforeEach(async () => {
  w = await world();
});

async function run(ids: string[], extra: Partial<Parameters<typeof ingestBatch>[1]> = {}) {
  const events: PipelineEvent[] = [];
  await ingestBatch(w.deps, { projectId: "p1", source: "bulk_import", assetIds: ids, batchId: "b1", ...extra }, (e) => events.push(e));
  return events;
}
const item = (id: string) => repo.evidenceItem(w.db, id);

describe("ingestBatch", () => {
  it("accepts a clean follow-up, registers it, grades the site and tags Cloudinary", async () => {
    w.media.add(analysis("f1", { phash: "2222222222222222" }));
    const events = await run(["f1"]);
    const e = await item("f1");
    expect(e).toMatchObject({ status: "accepted", siteId: "s1", relevance: "evidence", timepoint: "2026-09-28" });
    expect(await repo.derivativeFor(w.db, "f1")).toMatchObject({ quality: "good", alignedAssetId: "saakshya/derived/f1_aligned" });
    const [a] = await repo.assessmentsForSite(w.db, "s1");
    expect(a).toMatchObject({ timepoint: "2026-09-28", grade: 3, status: "accepted" });
    expect(w.media.contexts.f1).toMatchObject({ site_id: "s1", status: "accepted" });
    expect(events.map((x) => x.type)).toEqual(["analyzed", "decided", "assessed", "done"]);
  });

  it("flags a photo reused from another site as recycled and sends it to review", async () => {
    await repo.upsertEvidence(w.db, {
      assetId: "old-c",
      projectId: "p1",
      siteId: "s2",
      batchId: "b0",
      source: "implementer",
      status: "accepted",
      secureUrl: "u",
      width: 1,
      height: 1,
      phash: "3333333333333333",
      capturedAt: new Date("2026-09-22T10:00:00+05:30"),
      tags: [],
      missingSignals: [],
      flags: [],
    });
    w.media.add(analysis("f2", { phash: "3333333333333333" }));
    await run(["f2"]);
    const e = await item("f2");
    expect(e?.status).toBe("needs_review");
    expect(e?.flags.map((f) => f.kind)).toContain("recycled_image");
    expect(e?.flags.find((f) => f.kind === "recycled_image")?.relatedAssetIds).toEqual(["old-c"]);
  });

  it("flags an old photo presented as new", async () => {
    w.media.add(analysis("f3", { capturedAt: "2025-02-01T10:00:00+05:30" }));
    await run(["f3"]);
    expect((await item("f3"))?.flags.map((f) => f.kind)).toContain("date_out_of_period");
  });

  it("flags GPS outside the site radius", async () => {
    w.media.add(analysis("f4", { gps: { lat: 28.62, lon: 77.2 } }));
    w.decisions.site.f4 = "s1";
    await run(["f4"]);
    expect((await item("f4"))?.flags.map((f) => f.kind)).toContain("outside_site_radius");
  });

  it("treats failed registration as a possible different location and does not grade", async () => {
    w.media.add(analysis("f5"));
    w.registration.results.f5 = {
      quality: "failed",
      inliers: 6,
      inlierRatio: 0.05,
      homography: null,
      alignedAssetId: null,
      differenceAssetId: null,
      inlierPoints: [],
      metrics: null,
    };
    await run(["f5"]);
    const e = await item("f5");
    expect(e?.status).toBe("needs_review");
    expect(e?.flags.map((f) => f.kind)).toContain("possible_different_location");
    expect(await repo.assessmentsForSite(w.db, "s1")).toHaveLength(0);
  });

  it("routes low-confidence triage to review", async () => {
    w.media.add(analysis("f6"));
    w.decisions.confidence.f6 = 0.55;
    await run(["f6"]);
    expect((await item("f6"))?.status).toBe("needs_review");
  });

  it("sets aside screenshots with a reason and does not register them", async () => {
    w.media.add(analysis("f7", { caption: "a screenshot of a chat" }));
    w.decisions.relevance.f7 = "screenshot_or_meme";
    await run(["f7"]);
    expect(await item("f7")).toMatchObject({ status: "set_aside", statusReason: "Not field evidence: screenshot_or_meme" });
    expect(w.registration.calls).not.toContain("f7");
  });

  it("keeps the first of a same-visit burst and sets the rest aside", async () => {
    w.media.add(analysis("burst-1", { phash: "4444444444444444", capturedAt: "2026-09-28T10:00:00+05:30" }));
    w.media.add(analysis("burst-2", { phash: "4444444444444445", capturedAt: "2026-09-28T10:00:05+05:30" }));
    await run(["burst-2", "burst-1"]);
    expect((await item("burst-1"))?.status).toBe("accepted");
    expect((await item("burst-2"))?.status).toBe("set_aside");
  });

  it("uses WhatsApp chat time when EXIF is missing and notes it", async () => {
    w.media.add(analysis("IMG-20260929-WA0001", { capturedAt: null, gps: null }));
    await run(["IMG-20260929-WA0001"], {
      meta: {
        "IMG-20260929-WA0001": {
          filename: "IMG-20260929-WA0001.jpg",
          sentAt: "2026-09-29T08:15:00+05:30",
          sender: "Riya",
          comment: "Plot B",
        },
      },
    });
    const e = await item("IMG-20260929-WA0001");
    expect(e?.timepoint).toBe("2026-09-29");
    expect(e?.sender).toBe("Riya");
    expect(e?.flags.map((f) => f.kind)).toEqual(expect.arrayContaining(["capture_time_from_chat", "location_inferred"]));
  });

  it("records pending, never invented, decisions when Jev is down", async () => {
    w.media.add(analysis("f8"));
    w.decisions.unavailable = true;
    const events = await run(["f8"]);
    expect((await item("f8"))?.status).toBe("pending");
    const ds = await repo.decisionsFor(w.db, "f8");
    expect(ds.every((d) => d.status === "pending" && d.answer === null)).toBe(true);
    expect(events.some((e) => e.type === "pending")).toBe(true);
  });

  it("marks evidence pending when the CV worker is down", async () => {
    w.media.add(analysis("f9"));
    w.registration.unavailable = true;
    await run(["f9"]);
    expect(await item("f9")).toMatchObject({ status: "pending", statusReason: "Alignment pending: CV worker unavailable" });
  });

  it("flags a monsoon claim contradicted by a hot, dry recorded day at the site", async () => {
    await repo.createClaim(w.db, {
      id: "c2", projectId: "p1", siteId: "s2",
      periodStart: "2026-09-20", periodEnd: "2026-10-10",
      text: "Monsoon plantation drive completed across Plot C",
    });
    w.weather.byDate["2026-09-28"] = { tempMaxC: 38, tempMinC: 27, precipitationMm: 0 };
    w.media.add(analysis("f10", { gps: { lat: 28.65, lon: 77.25 } }));
    w.decisions.site.f10 = "s2";
    await run(["f10"]);
    const e = await item("f10");
    expect(e?.flags.map((f) => f.kind)).toContain("weather_mismatch");
    expect(w.weather.calls).toEqual([{ lat: 28.65, lon: 77.25, date: "2026-09-28" }]);
  });

  it("skips site assignment for witness submissions from a site QR", async () => {
    w.media.add(analysis("wit1"));
    await ingestBatch(w.deps, { projectId: "p1", source: "witness", assetIds: ["wit1"], batchId: "b2", siteId: "s1" });
    const ds = await repo.decisionsFor(w.db, "wit1");
    expect(ds.map((d) => d.kind)).not.toContain("triage_site");
    expect((await item("wit1"))?.siteId).toBe("s1");
  });

  it("reports measured batch usage in the done event", async () => {
    w.media.add(analysis("f10"));
    const events = await run(["f10"]);
    const done = events.find((e) => e.type === "done");
    expect(done && done.type === "done" && done.usage.inputTokens).toBeGreaterThan(0);
  });

  it("uses browser GPS and server receipt time for canvas captures", async () => {
    w.media.add(analysis("cam1", { gps: null, capturedAt: null }));
    await ingestBatch(w.deps, {
      projectId: "p1",
      source: "witness",
      assetIds: ["cam1"],
      batchId: "bw",
      siteId: "s1",
      meta: {
        cam1: {
          gps: { lat: 28.6001, lon: 77.2001 },
          sentAt: "2026-09-30T09:00:00+05:30",
          timeSource: "the time the photo reached the server",
        },
      },
    });
    const e = await repo.evidenceItem(w.db, "cam1");
    expect(e).toMatchObject({ lat: 28.6001, timepoint: "2026-09-30" });
    expect(e?.flags.find((f) => f.kind === "capture_time_from_chat")?.detail).toMatch(/reached the server/);
  });
});


export { DecisionsUnavailable };
