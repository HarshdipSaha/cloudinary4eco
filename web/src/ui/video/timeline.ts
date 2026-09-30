export interface TimedObservation {
  assetId: string;
  second: number;
}

/** Browsers land a seek slightly before the requested time; within this window we treat it as arrived. */
const SEEK_TOLERANCE_SECONDS = 0.25;

export function activeObservation<T extends TimedObservation>(items: T[], currentTime: number): T | null {
  let active: T | null = null;
  for (const item of [...items].sort((a, b) => a.second - b.second)) {
    if (item.second <= currentTime + SEEK_TOLERANCE_SECONDS) active = item;
    else break;
  }
  return active;
}

export function markerPercent(second: number, durationSeconds: number): number {
  if (!(durationSeconds > 0)) return 0;
  return Math.min(100, Math.max(0, (second / durationSeconds) * 100));
}
