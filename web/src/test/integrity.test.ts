import { describe, it, expect } from "vitest";
import { checkIntegrity, checkWeatherPlausibility, type PriorHash } from "@/domain/integrity";
import type { MediaAnalysis, Site } from "@/domain/types";

const site: Site = { id: "s1", projectId: "p", name: "Plot B", description: "", location: { lat: 28.6, lon: 77.2 }, radiusM: 100, baselineAssetId: "base", qrSlug: "q" };
const base: MediaAnalysis = {
  assetId: "x", secureUrl: "u", width: 1, height: 1, caption: null, tags: [], ocrText: null,
  capturedAt: "2026-09-25T10:00:00+05:30", gps: { lat: 28.6, lon: 77.2 }, phash: "0f0f0f0f0f0f0f0f", faceCount: 0, missingSignals: [],
};
const period = { start: "2026-09-20", end: "2026-10-05" };
const kinds = (f: { kind: string }[]) => f.map((x) => x.kind).sort();

describe("checkIntegrity", () => {
  it("passes a clean on-site, in-period, unique photo", () => {
    expect(checkIntegrity({ analysis: base, site, period, priors: [] })).toEqual([]);
  });
  it("flags GPS outside the site radius", () => {
    const f = checkIntegrity({ analysis: { ...base, gps: { lat: 28.62, lon: 77.2 } }, site, period, priors: [] });
    expect(kinds(f)).toEqual(["outside_site_radius"]);
    expect(f[0]!.detail).toMatch(/km|m from/);
  });
  it("notes location_inferred when GPS is missing", () => {
    expect(kinds(checkIntegrity({ analysis: { ...base, gps: null }, site, period, priors: [] }))).toEqual(["location_inferred"]);
  });
  it("flags capture date outside the claim period", () => {
    const f = checkIntegrity({ analysis: { ...base, capturedAt: "2025-01-10T10:00:00+05:30" }, site, period, priors: [] });
    expect(kinds(f)).toEqual(["date_out_of_period"]);
  });
  it("flags a near-identical image already used at another site as recycled", () => {
    const priors: PriorHash[] = [{ assetId: "old", siteId: "s2", phash: "0f0f0f0f0f0f0f0e", capturedAt: "2026-09-25T09:00:00+05:30" }];
    const f = checkIntegrity({ analysis: base, site, period, priors });
    expect(kinds(f)).toEqual(["recycled_image"]);
    expect(f[0]!.relatedAssetIds).toEqual(["old"]);
  });
  it("flags a near-identical image captured days earlier at the same site as recycled", () => {
    const priors: PriorHash[] = [{ assetId: "old", siteId: "s1", phash: "0f0f0f0f0f0f0f0f", capturedAt: "2026-09-01T09:00:00+05:30" }];
    expect(kinds(checkIntegrity({ analysis: base, site, period, priors }))).toEqual(["recycled_image"]);
  });
  it("marks a same-site burst within 24h as duplicate, not recycled", () => {
    const priors: PriorHash[] = [{ assetId: "burst1", siteId: "s1", phash: "0f0f0f0f0f0f0f0f", capturedAt: "2026-09-25T09:59:30+05:30" }];
    expect(kinds(checkIntegrity({ analysis: base, site, period, priors }))).toEqual(["duplicate"]);
  });
  it("ignores its own prior entry", () => {
    const priors: PriorHash[] = [{ assetId: "x", siteId: "s1", phash: base.phash!, capturedAt: base.capturedAt }];
    expect(checkIntegrity({ analysis: base, site, period, priors })).toEqual([]);
  });
});

describe("checkWeatherPlausibility", () => {
  it("flags a monsoon claim against a hot, dry recorded day", () => {
    const f = checkWeatherPlausibility({
      claimText: "Monsoon plantation drive completed across the site",
      weather: { tempMaxC: 38, tempMinC: 27, precipitationMm: 0 },
    });
    expect(f.map((x) => x.kind)).toEqual(["weather_mismatch"]);
    expect(f[0]!.detail).toMatch(/38.*0\.0 mm/);
  });
  it("does not flag a monsoon claim when it actually rained", () => {
    expect(checkWeatherPlausibility({ claimText: "monsoon plantation drive", weather: { tempMaxC: 26, tempMinC: 22, precipitationMm: 40 } })).toEqual([]);
  });
  it("does not flag a claim with no wet-weather keywords", () => {
    expect(checkWeatherPlausibility({ claimText: "300 saplings planted", weather: { tempMaxC: 38, tempMinC: 27, precipitationMm: 0 } })).toEqual([]);
  });
  it("does nothing when weather data is unavailable", () => {
    expect(checkWeatherPlausibility({ claimText: "monsoon plantation drive", weather: null })).toEqual([]);
  });
});
