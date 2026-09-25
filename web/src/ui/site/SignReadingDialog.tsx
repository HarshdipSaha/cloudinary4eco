"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { SRC_RUBRICS } from "@/domain/src-rubrics";
import type { ProjectType } from "@/domain/types";
import { Button } from "@/ui/Button";

export function SignReadingDialog({
  open,
  onOpenChange,
  siteId,
  timepoint,
  projectType,
  modelGrade,
  onSigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  timepoint: string;
  projectType: ProjectType;
  modelGrade: number | null;
  onSigned: () => void;
}) {
  const rubric = SRC_RUBRICS[projectType] ?? SRC_RUBRICS.plantation;
  const [selectedGrade, setSelectedGrade] = useState<number>(modelGrade ?? 1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isChangingGrade = modelGrade !== null && selectedGrade !== modelGrade;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isChangingGrade && !reason.trim()) {
      setError("Changing the model's grade requires a non-empty reason.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/sign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          timepoint,
          grade: selectedGrade,
          reason: reason.trim() || undefined,
          actor: "reviewer",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onOpenChange(false);
      onSigned();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border border-line bg-surface-1 p-6 text-text shadow-none">
          <Dialog.Title className="text-[16px] font-semibold">Sign Site Reading</Dialog.Title>
          <Dialog.Description className="mt-1 text-[12px] text-text-2">
            Confirm or adjust the Site Response Criteria (SRC) grade for {timepoint}.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-text-2">Select Grade:</label>
              <div className="flex flex-col gap-1.5 border border-line bg-surface-0 p-2">
                {rubric.levels.map((desc: string, level: number) => {
                  const label = rubric.labels[level] ?? desc;
                  return (
                    <label
                      key={level}
                      className={`flex cursor-pointer items-start gap-2.5 p-2 rounded-[2px] transition-colors ${
                        selectedGrade === level ? "bg-surface-2 text-text" : "hover:bg-surface-1 text-text-2"
                      }`}
                    >
                      <input
                        type="radio"
                        name="grade"
                        value={level}
                        checked={selectedGrade === level}
                        onChange={() => setSelectedGrade(level)}
                        className="mt-1 accent-measure"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="mono font-semibold" style={{ color: `var(--grade-${level})` }}>
                            Level {level}: {label}
                          </span>
                          {modelGrade === level && (
                            <span className="mono rounded-[2px] border border-line bg-surface-1 px-1 text-[10px] text-text-3">
                              Model suggestion
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-text-3">{desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-text-2">
                Reason {isChangingGrade ? "(Required to change grade)" : "(Optional note)"}:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isChangingGrade ? "Explain why you are changing the grade..." : "Confirmation notes..."}
                rows={3}
                className="w-full border border-line bg-surface-0 p-2 text-[12px] text-text focus:outline-measure"
              />
            </div>

            {error && <div className="text-[12px] text-flag">{error}</div>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="quiet" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Signing..." : "Sign and Confirm"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
