"use client";

import { useState, useEffect, useRef } from "react";
import { cld } from "@/ui/cld";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";

export interface SequenceFrame {
  timepoint: string;
  assetId: string;
  label: string;
  grade?: number | null;
}

export function SequencePlayer({ frames }: { frames: SequenceFrame[] }) {
  const [currentIndex, setCurrentIndex] = useState<number>(Math.max(0, frames.length - 1));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % frames.length);
    }, 1200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, frames.length]);

  if (!frames.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[4px] border border-paper-line bg-paper-surface text-[13px] text-paper-ink-muted">
        No photographic frames available.
      </div>
    );
  }

  const current = frames[currentIndex]!;

  return (
    <div className="space-y-4">
      {/* Frame Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-[4px] border border-paper-line bg-black">
        {frames.map((f, idx) => (
          <img
            key={f.assetId}
            src={cld.publicPlate(f.assetId, 1024)}
            alt={`${f.label} on ${f.timepoint}`}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
              idx === currentIndex ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
        ))}

        {/* Overlay Badges */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded bg-black/70 px-2.5 py-1 text-white font-mono text-[12px]">
          <span>{current.label}</span>
          <span>·</span>
          <span>{current.timepoint}</span>
          {typeof current.grade === "number" && (
            <>
              <span>·</span>
              <span className="text-measure font-semibold">Grade {current.grade}</span>
            </>
          )}
        </div>
      </div>

      {/* Scrubber & Controls */}
      <div className="flex flex-col gap-2 rounded-[4px] border border-paper-line bg-paper-surface p-3">
        <div className="flex items-center justify-between gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border border-paper-line bg-paper text-paper-ink hover:bg-paper-surface active:scale-95"
            aria-label={isPlaying ? "Pause sequence" : "Play sequence"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>

          {/* Scrubber Range Input */}
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={currentIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIndex(parseInt(e.target.value, 10));
              }}
              className="w-full accent-measure"
            />
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentIndex === 0}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-paper-line text-paper-ink disabled:opacity-40"
              aria-label="Previous frame"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex((prev) => Math.min(frames.length - 1, prev + 1));
              }}
              disabled={currentIndex === frames.length - 1}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-paper-line text-paper-ink disabled:opacity-40"
              aria-label="Next frame"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Date chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {frames.map((f, idx) => (
            <button
              key={f.assetId}
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex(idx);
              }}
              className={`rounded-[2px] px-2 py-0.5 font-mono text-[11px] transition-colors ${
                idx === currentIndex
                  ? "bg-measure text-measure-ink font-semibold"
                  : "bg-paper text-paper-ink-muted hover:text-paper-ink"
              }`}
            >
              {f.timepoint}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
