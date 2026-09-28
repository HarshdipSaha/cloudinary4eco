import type { EvidenceStatus, FlagKind, ProjectType } from "@/domain/types";
import { INTEGRITY_FLAGS } from "@/domain/types";
import { gradeLabel } from "@/domain/src-rubrics";

export type Tone = "measure" | "attention" | "flag" | "note" | "muted";

export function statusMarkSpec(s: EvidenceStatus) {
  return {
    accepted: { glyph: "✓", label: "Accepted", tone: "measure" as Tone },
    needs_review: { glyph: "◐", label: "Needs review", tone: "attention" as Tone },
    set_aside: { glyph: "—", label: "Set aside", tone: "muted" as Tone },
    pending: { glyph: "◌", label: "Pending", tone: "muted" as Tone },
  }[s];
}

const FLAG_LABEL: Record<FlagKind, string> = {
  recycled_image: "Recycled image",
  date_out_of_period: "Date outside period",
  outside_site_radius: "Outside site",
  possible_different_location: "Different location?",
  duplicate: "Duplicate",
  location_inferred: "No GPS",
  capture_time_from_chat: "Time from chat",
  date_unknown: "No capture time",
  weather_mismatch: "Weather mismatch",
};

export function flagSpec(k: FlagKind) {
  const integrity = INTEGRITY_FLAGS.includes(k);
  return { label: FLAG_LABEL[k], glyph: integrity ? "◆" : "·", tone: (integrity ? "flag" : "note") as Tone };
}

export function gradeSpec(type: ProjectType, grade: number) {
  return {
    label: gradeLabel(type, grade),
    glyph: grade === 0 ? "▼" : grade === 1 ? "▬" : grade === 2 ? "△" : "▲",
    level: grade,
  };
}
