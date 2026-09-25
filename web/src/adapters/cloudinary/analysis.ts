import type { MediaAnalysis } from "@/domain/types";
import { capturedAtFromMetadata, gpsFromMetadata } from "@/domain/exif";

type Json = Record<string, any>;

function captionOf(r: Json): string | null {
  const c = r.info?.detection?.captioning?.data?.caption ?? r.info?.detection?.captioning?.caption;
  return typeof c === "string" && c.trim() ? c.trim() : null;
}

function ocrOf(r: Json): string | null {
  const ann = r.info?.ocr?.adv_ocr?.data?.[0]?.textAnnotations?.[0]?.description;
  return typeof ann === "string" && ann.trim() ? ann.trim() : null;
}

function phashOf(r: Json): string | null {
  const p = r.phash;
  return typeof p === "string" && /^[0-9a-f]{16}$/i.test(p) ? p.toLowerCase() : null;
}

export function toMediaAnalysis(r: Json): MediaAnalysis {
  const meta: Json = r.image_metadata ?? r.metadata ?? {};
  const caption = captionOf(r);
  const ocrText = ocrOf(r);
  const gps = gpsFromMetadata(meta);
  const capturedAt = capturedAtFromMetadata(meta);
  const phash = phashOf(r);
  const faceCount = Array.isArray(r.faces) ? r.faces.length : null;
  const missingSignals = [
    caption === null && "caption",
    ocrText === null && "ocr",
    gps === null && "gps",
    capturedAt === null && "capture_time",
    phash === null && "phash",
    faceCount === null && "faces",
  ].filter(Boolean) as string[];

  return {
    assetId: String(r.public_id),
    secureUrl: String(r.secure_url),
    width: Number(r.width ?? 0),
    height: Number(r.height ?? 0),
    caption,
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    ocrText,
    capturedAt,
    gps,
    phash,
    faceCount,
    missingSignals,
  };
}
