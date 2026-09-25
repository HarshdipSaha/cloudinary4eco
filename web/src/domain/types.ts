export const PROJECT_TYPES = ["plantation", "cleanup", "water_point", "sanitation", "construction"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export type EvidenceSource = "implementer" | "witness" | "bulk_import";
export type EvidenceStatus = "pending" | "accepted" | "needs_review" | "set_aside";
export const RELEVANCE = ["evidence", "people_only", "screenshot_or_meme", "unusable_quality"] as const;
export type Relevance = (typeof RELEVANCE)[number];
export type RegistrationQuality = "good" | "weak" | "failed";
export const AGREEMENT = ["corroborates", "contradicts", "insufficient"] as const;
export type WitnessAgreement = (typeof AGREEMENT)[number];

/** Integrity flags need a human; notes are informational. */
export type FlagKind =
  | "recycled_image"
  | "date_out_of_period"
  | "outside_site_radius"
  | "possible_different_location"
  | "duplicate"
  | "location_inferred"
  | "capture_time_from_chat"
  | "date_unknown";
export const INTEGRITY_FLAGS: readonly FlagKind[] = [
  "recycled_image", "date_out_of_period", "outside_site_radius", "possible_different_location",
];
export interface Flag { kind: FlagKind; detail: string; relatedAssetIds: string[] }

export interface LatLon { lat: number; lon: number }

export interface MediaAnalysis {
  assetId: string;
  secureUrl: string;
  width: number;
  height: number;
  caption: string | null;
  tags: string[];
  ocrText: string | null;
  capturedAt: string | null; // ISO with offset
  gps: LatLon | null;
  phash: string | null; // 16 hex chars
  faceCount: number | null;
  missingSignals: string[]; // e.g. ["caption", "ocr"]
}

export interface Site {
  id: string;
  projectId: string;
  name: string;
  description: string;
  location: LatLon;
  radiusM: number;
  baselineAssetId: string | null;
  qrSlug: string;
}

export interface Claim { id: string; projectId: string; siteId: string | null; periodStart: string; periodEnd: string; text: string }

export interface ChangeMetrics {
  vegetationFractionBefore: number;
  vegetationFractionAfter: number;
  vegetationDelta: number;
  changedAreaFraction: number;
  brightnessShift: number;
}

export interface RegistrationResult {
  quality: RegistrationQuality;
  inliers: number;
  inlierRatio: number;
  homography: number[] | null;
  alignedAssetId: string | null;
  differenceAssetId: string | null;
  inlierPoints: [number, number][]; // normalised 0..1 in baseline frame
  metrics: ChangeMetrics | null;
}

export type DecisionKind =
  | "triage_site" | "triage_relevance" | "triage_activity"
  | "src_grade" | "witness_agreement" | "sentence_support" | "search_relevance";

export interface Decision<T = unknown> {
  kind: DecisionKind;
  subjectId: string;
  /** The exact question and state sent to Jev (receipts, reproducibility). Absent in fakes. */
  question?: unknown;
  state?: unknown;
  answer: T;
  probabilities: Record<string, number>;
  confidence: number;
  model: string;
  latencyMs: number;
  inputTokens: number;
}
