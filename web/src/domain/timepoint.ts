const IST_OFFSET_MIN = 330;

/** Calendar date (YYYY-MM-DD) in India Standard Time. */
export function timepointOf(iso: string): string {
  const t = new Date(iso).getTime() + IST_OFFSET_MIN * 60_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000);
}
