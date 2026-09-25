import type { LatLon } from "./types";

const R = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineM(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function nearestSites<S extends { location: LatLon }>(
  point: LatLon,
  sites: S[],
  opts: { maxM: number; limit: number },
): { site: S; distanceM: number }[] {
  return sites
    .map((site) => ({ site, distanceM: haversineM(point, site.location) }))
    .filter((x) => x.distanceM <= opts.maxM)
    .sort((x, y) => x.distanceM - y.distanceM)
    .slice(0, opts.limit);
}
