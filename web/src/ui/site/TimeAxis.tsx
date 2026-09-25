"use client";

import { useEffect } from "react";
import type { ProjectType } from "@/domain/types";
import { gradeSpec } from "@/ui/marks-spec";

export interface TimeAxisTick {
  timepoint: string;
  grade: number | null;
  status: string;
  hasFlags: boolean;
  photoCount: number;
}

export function TimeAxis({
  ticks,
  selected,
  onSelect,
  projectType,
}: {
  ticks: TimeAxisTick[];
  selected: string;
  onSelect: (timepoint: string) => void;
  projectType: ProjectType;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest("input, textarea, [contenteditable]")) return;
      const idx = ticks.findIndex((t) => t.timepoint === selected);
      if (idx === -1) return;
      if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        e.preventDefault();
        if (idx < ticks.length - 1) onSelect(ticks[idx + 1]!.timepoint);
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        e.preventDefault();
        if (idx > 0) onSelect(ticks[idx - 1]!.timepoint);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ticks, selected, onSelect]);

  return (
    <nav
      className="relative flex w-[72px] shrink-0 flex-col items-center border-r border-line bg-surface-1 py-4 select-none"
      aria-label="Timepoint navigation (use J/K or arrows)"
    >
      <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-line" aria-hidden="true" />
      <div className="z-10 flex w-full flex-col gap-4">
        {ticks.map((t) => {
          const isSelected = t.timepoint === selected;
          const gSpec = t.grade !== null ? gradeSpec(projectType, t.grade) : null;
          const label = `${t.timepoint}, ${gSpec?.label ?? "Pending"}, ${t.photoCount} photos`;

          return (
            <button
              key={t.timepoint}
              onClick={() => onSelect(t.timepoint)}
              aria-label={label}
              aria-current={isSelected ? "date" : undefined}
              className={`group relative flex w-full flex-col items-center py-1 transition-colors ${
                isSelected ? "text-text" : "text-text-3 hover:text-text-2"
              }`}
            >
              {isSelected && (
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-[2px] bg-measure"
                />
              )}
              <div
                className={`flex size-6 items-center justify-center rounded-full border bg-surface-0 font-mono text-[11px] transition-transform ${
                  isSelected ? "scale-110 border-measure" : "border-line group-hover:border-text-3"
                }`}
                style={{
                  color: t.hasFlags
                    ? "var(--flag)"
                    : t.grade !== null
                    ? `var(--grade-${t.grade})`
                    : "var(--text-3)",
                }}
              >
                {t.hasFlags ? "◆" : t.grade !== null ? gSpec?.glyph : "◌"}
              </div>
              <span className="mono mt-1 text-[10px] tabular tracking-tight">
                {t.timepoint.slice(5)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
