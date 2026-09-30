"use client";

import { useState } from "react";
import type { ProjectType } from "@/domain/types";
import { SRC_RUBRICS } from "@/domain/src-rubrics";
import { GradeGlyph, StatusMark } from "@/ui/marks";
import { ProbabilityBar } from "@/ui/ProbabilityBar";
import { Button } from "@/ui/Button";
import { Kbd } from "@/ui/Kbd";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface DecisionRecord {
  model: string | null;
  latencyMs: number | null;
  inputTokens: number | null;
  probabilities: Record<string, number> | null;
  confidence: number | null;
  state: any;
  question: any;
  stateHash: string | null;
}

export function GradeStrip({
  siteId,
  timepoint,
  projectType,
  grade,
  status,
  decision,
  onOpenSign,
  onSendToReview,
  onRetryGrade,
}: {
  siteId: string;
  timepoint: string;
  projectType: ProjectType;
  grade: number | null;
  status: string;
  decision: DecisionRecord | null;
  onOpenSign: () => void;
  onSendToReview: () => void;
  onRetryGrade: () => void;
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const rubric = SRC_RUBRICS[projectType] ?? SRC_RUBRICS.plantation;
  const labels = Object.fromEntries(rubric.labels.map((lbl: string, idx: number) => [String(idx), lbl]));

  if (grade === null || status === "pending") {
    return (
      <div className="flex items-center justify-between border-t border-line bg-surface-1 px-4 py-3">
        <div className="flex items-center gap-2 text-[12px] text-text-2">
          <span className="mono text-attention">◌</span>
          <span>Grade pending: Jev evaluation pending for this timepoint.</span>
        </div>
        <Button variant="primary" onClick={onRetryGrade}>
          Retry grading
        </Button>
      </div>
    );
  }

  const probs = decision?.probabilities;
  const topProb = probs?.[String(grade)] ?? null;
  const confidence = decision?.confidence ?? null;

  return (
    <div className="flex flex-col border-t border-line bg-surface-1">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-col gap-2 min-w-[280px]">
          <div className="flex items-center gap-3">
            <GradeGlyph type={projectType} grade={grade} size="lg" />
            <StatusMark status={status as any} />
            {topProb !== null ? (
              <span className="mono text-[12px] text-text-3">
                model p {Math.round(topProb * 100)}%
              </span>
            ) : confidence !== null ? (
              <span className="mono text-[12px] text-text-3">
                Jev confidence {Math.round(confidence * 100)}%
              </span>
            ) : (
              <span className="mono text-[12px] text-text-3">Decision probability unavailable</span>
            )}
          </div>

          {probs && Object.keys(probs).length > 0 && (
            <ProbabilityBar
              probabilities={probs}
              chosen={String(grade)}
              labels={labels}
            />
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="mono text-[11px] text-text-3">
            {decision
              ? `Jev ${decision.model ?? "model unavailable"} · ${decision.latencyMs ?? "—"} ms · ${decision.inputTokens ?? "—"} tok`
              : "Jev decision record unavailable"}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWhyOpen(!whyOpen)}
              className="flex cursor-pointer items-center gap-1 text-[11px] text-text-2 hover:text-text"
            >
              <span>Why: receipts & inputs</span>
              {whyOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>

            {status !== "signed" && (
              <Button variant="quiet" onClick={onSendToReview} className="gap-1.5">
                Review <Kbd>R</Kbd>
              </Button>
            )}

            <Button variant="primary" onClick={onOpenSign} className="gap-1.5">
              Sign reading <Kbd>A</Kbd>
            </Button>
          </div>
        </div>
      </div>

      {whyOpen && (
        <div className="border-t border-line bg-surface-0 p-4 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text">Deterministic Decision Audit Trail</span>
            {decision?.stateHash && (
              <span className="mono text-[10px] text-text-3">
                SHA-256 state hash: {decision.stateHash}
              </span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-text-3">Decision State Inputs:</span>
              <pre className="mono max-h-40 overflow-auto border border-line bg-surface-1 p-2 text-[10px] text-text-2">
                {JSON.stringify(decision?.state ?? {}, null, 2)}
              </pre>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-text-3">Jev Typed Question:</span>
              <pre className="mono max-h-40 overflow-auto border border-line bg-surface-1 p-2 text-[10px] text-text-2">
                {JSON.stringify(decision?.question ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
