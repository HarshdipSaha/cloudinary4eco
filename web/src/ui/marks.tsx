import type { EvidenceStatus, FlagKind, ProjectType } from "@/domain/types";
import { flagSpec, gradeSpec, statusMarkSpec, type Tone } from "./marks-spec";

const toneClass: Record<Tone, string> = {
  measure: "text-measure",
  attention: "text-attention",
  flag: "text-flag",
  note: "text-text-2",
  muted: "text-text-3",
};

export function StatusMark({ status, reason }: { status: EvidenceStatus; reason?: string | null }) {
  const s = statusMarkSpec(status);
  return (
    <span className={`inline-flex items-center gap-1.5 ${toneClass[s.tone]}`} title={reason ?? undefined}>
      <span aria-hidden className="mono w-3 text-center">
        {s.glyph}
      </span>
      <span className={status === "set_aside" ? "line-through decoration-1" : ""}>{s.label}</span>
    </span>
  );
}

export function FlagMark({ kind, detail }: { kind: FlagKind; detail?: string }) {
  const f = flagSpec(kind);
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${toneClass[f.tone]}`} title={detail}>
      <span aria-hidden className="mono">
        {f.glyph}
      </span>
      {f.label}
    </span>
  );
}

export function GradeGlyph({ type, grade, size = "md" }: { type: ProjectType; grade: number; size?: "md" | "lg" }) {
  const g = gradeSpec(type, grade);
  return (
    <span className={`inline-flex items-center gap-2 ${size === "lg" ? "text-[20px]" : ""}`}>
      <span aria-hidden className="mono" style={{ color: `var(--grade-${g.level})` }}>
        {g.glyph}
      </span>
      <span>{g.label}</span>
    </span>
  );
}
