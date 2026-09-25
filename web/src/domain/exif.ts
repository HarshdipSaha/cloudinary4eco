import type { LatLon } from "./types";

type Meta = Record<string, unknown>;

export function parseDms(raw: string): number | null {
  const s = raw.trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  const m = s.match(/(\d+(?:\.\d+)?)\s*deg\s*(\d+(?:\.\d+)?)'\s*(\d+(?:\.\d+)?)"?\s*([NSEW])?/i);
  if (!m) return null;
  const value = Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600;
  const hemi = m[4]?.toUpperCase();
  return hemi === "S" || hemi === "W" ? -value : value;
}

function applyRef(value: number, ref: unknown): number {
  const r = typeof ref === "string" ? ref.trim().toUpperCase() : "";
  return r.startsWith("S") || r.startsWith("W") ? -Math.abs(value) : value;
}

export function gpsFromMetadata(meta: Meta): LatLon | null {
  const latRaw = meta.GPSLatitude;
  const lonRaw = meta.GPSLongitude;
  if (typeof latRaw !== "string" || typeof lonRaw !== "string") return null;
  const lat = parseDms(latRaw);
  const lon = parseDms(lonRaw);
  if (lat === null || lon === null) return null;
  const out = { lat: applyRef(lat, meta.GPSLatitudeRef ?? (latRaw.match(/[NS]\s*$/i)?.[0])), lon: applyRef(lon, meta.GPSLongitudeRef ?? (lonRaw.match(/[EW]\s*$/i)?.[0])) };
  if (out.lat === 0 && out.lon === 0) return null;
  return out;
}

export function parseExifDate(raw: string, offset = "+05:30"): string | null {
  const m = raw.trim().match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${offset}`;
}

export function capturedAtFromMetadata(meta: Meta): string | null {
  const raw = meta.DateTimeOriginal ?? meta.CreateDate;
  if (typeof raw !== "string") return null;
  const off = typeof meta.OffsetTimeOriginal === "string" && /^[+-]\d{2}:\d{2}$/.test(meta.OffsetTimeOriginal)
    ? meta.OffsetTimeOriginal
    : "+05:30";
  return parseExifDate(raw, off);
}
