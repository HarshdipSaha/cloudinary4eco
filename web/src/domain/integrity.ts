import type { Flag, MediaAnalysis, Site } from "./types";
import { haversineM } from "./geo";
import { hamming } from "./phash";
import { timepointOf } from "./timepoint";
import { THRESHOLDS } from "./thresholds";
import type { DailyWeather } from "@/ports/weather";

export interface PriorHash { assetId: string; siteId: string | null; phash: string; capturedAt: string | null }

const WET_CLAIM_KEYWORDS = ["monsoon", "rain", "rains", "rainy", "downpour", "flood", "flooded"];
const WET_MISMATCH_MAX_PRECIP_MM = 1;
const WET_MISMATCH_MIN_TEMP_C = 30;

/** A hard fraud signal Jev never sees: does the claim's own words match what actually happened at that GPS+date? */
export function checkWeatherPlausibility({ claimText, weather }: { claimText: string | null; weather: DailyWeather | null }): Flag[] {
  if (!weather) return [];
  const claimsWet = claimText != null && WET_CLAIM_KEYWORDS.some((k) => claimText.toLowerCase().includes(k));
  if (claimsWet && weather.precipitationMm <= WET_MISMATCH_MAX_PRECIP_MM && weather.tempMaxC >= WET_MISMATCH_MIN_TEMP_C) {
    return [{
      kind: "weather_mismatch",
      detail: `Claim describes monsoon/rain conditions, but recorded weather that day was ${weather.tempMaxC.toFixed(0)}°C with ${weather.precipitationMm.toFixed(1)} mm precipitation.`,
      relatedAssetIds: [],
    }];
  }
  return [];
}

export interface IntegrityInput {
  analysis: MediaAnalysis;
  site: Site | null;
  period: { start: string; end: string } | null; // YYYY-MM-DD inclusive
  priors: PriorHash[];
}

function fmtDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function checkIntegrity({ analysis, site, period, priors }: IntegrityInput): Flag[] {
  const flags: Flag[] = [];

  if (!analysis.gps) {
    flags.push({ kind: "location_inferred", detail: "No GPS in the photo; site was inferred from content.", relatedAssetIds: [] });
  } else if (site) {
    const d = haversineM(analysis.gps, site.location);
    if (d > site.radiusM) {
      flags.push({ kind: "outside_site_radius", detail: `Taken ${fmtDistance(d)} from ${site.name} (radius ${site.radiusM} m).`, relatedAssetIds: [] });
    }
  }

  if (analysis.capturedAt && period) {
    const day = timepointOf(analysis.capturedAt);
    if (day < period.start || day > period.end) {
      flags.push({ kind: "date_out_of_period", detail: `Captured ${day}, outside the claim period ${period.start} to ${period.end}.`, relatedAssetIds: [] });
    }
  }

  if (analysis.phash) {
    const recycled: string[] = [];
    const dupes: string[] = [];
    for (const p of priors) {
      if (p.assetId === analysis.assetId) continue;
      const h = hamming(analysis.phash, p.phash);
      if (h === null || h > THRESHOLDS.recycledHamming) continue;
      const sameSite = site !== null && p.siteId === site.id;
      const hoursApart = analysis.capturedAt && p.capturedAt
        ? Math.abs(new Date(analysis.capturedAt).getTime() - new Date(p.capturedAt).getTime()) / 3_600_000
        : Infinity;
      if (sameSite && hoursApart <= THRESHOLDS.duplicateWindowHours) dupes.push(p.assetId);
      else recycled.push(p.assetId);
    }
    if (recycled.length) {
      flags.push({ kind: "recycled_image", detail: `Near-identical to ${recycled.length} earlier submission(s) from a different site or date.`, relatedAssetIds: recycled });
    } else if (dupes.length) {
      flags.push({ kind: "duplicate", detail: `Near-identical burst of ${dupes.length} other photo(s) from the same visit.`, relatedAssetIds: dupes });
    }
  }

  return flags;
}
