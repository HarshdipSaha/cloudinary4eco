"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ProjectType } from "@/domain/types";
import { TimeAxis, type TimeAxisTick } from "./TimeAxis";
import { GradeStrip } from "./GradeStrip";
import { SignReadingDialog } from "./SignReadingDialog";
import { HangingProtocol, type HungImage } from "@/ui/hanging/HangingProtocol";
import { cld } from "@/ui/cld";
import { Button } from "@/ui/Button";

interface EvidenceRow {
  assetId: string;
  secureUrl: string;
  capturedAt: string | Date | null;
  timepoint: string | null;
  status: string;
  source: string;
  caption: string | null;
  flags: any[];
}

interface TimepointData {
  timepoint: string;
  grade: number | null;
  status: string;
  derivative: any | null;
  decision: any | null;
  source: EvidenceRow | null;
  photos: EvidenceRow[];
}

export function ReadingPanel({
  site,
  project,
  baseline,
  timepoints,
  counts,
  agreement,
}: {
  site: any;
  project: any;
  baseline: EvidenceRow | null;
  timepoints: TimepointData[];
  counts: Record<string, number>;
  agreement: any | null;
}) {
  const router = useRouter();
  const [selectedTimepoint, setSelectedTimepoint] = useState<string>(
    timepoints.at(-1)?.timepoint ?? ""
  );
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [signOpen, setSignOpen] = useState(false);

  const activeTP = timepoints.find((t) => t.timepoint === selectedTimepoint) ?? timepoints.at(-1);

  // Keyboard shortcut listeners (A for sign, R for review)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setSignOpen(true);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        router.push("/review");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  if (!baseline) {
    return (
      <div className="flex h-full flex-col p-8">
        <h1 className="text-xl font-bold">{site.name}</h1>
        <p className="mt-2 text-text-2">
          This site does not have a designated baseline photo yet. Select a photo below to set it as baseline:
        </p>
        <div className="mt-6 grid grid-cols-4 gap-4">
          {activeTP?.photos.map((p) => (
            <div key={p.assetId} className="flex flex-col gap-2 border border-line bg-surface-1 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cld.thumb(p.assetId, 300)} alt={p.caption ?? ""} className="h-44 w-full object-cover" />
              <Button
                variant="primary"
                onClick={async () => {
                  await fetch(`/api/sites/${site.id}/baseline`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ assetId: p.assetId }),
                  });
                  router.refresh();
                }}
              >
                Set as baseline
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ticks: TimeAxisTick[] = timepoints.map((t) => ({
    timepoint: t.timepoint,
    grade: t.grade,
    status: t.status,
    hasFlags: t.photos.some((p) => p.flags && p.flags.length > 0),
    photoCount: t.photos.length,
  }));

  const m = activeTP?.derivative?.metrics as Record<string, number> | null;
  const der = activeTP?.derivative;

  const priorHung: HungImage = {
    src: cld.plate(baseline.assetId, 1600),
    alt: `Baseline photo for ${site.name}`,
    corners: {
      tl: `PRIOR · ${baseline.timepoint ?? "Baseline"}`,
      tr: "BASELINE",
      bl: `${site.lat?.toFixed(4)}, ${site.lon?.toFixed(4)}`,
    },
  };

  const currentPhoto =
    (selectedPhotoId && activeTP?.photos.find((p) => p.assetId === selectedPhotoId)) ||
    activeTP?.source ||
    activeTP?.photos[0] ||
    baseline;

  const currentSrc = der?.alignedAssetId
    ? cld.plate(der.alignedAssetId, 1600)
    : cld.plate(currentPhoto.assetId, 1600);

  const currentHung: HungImage = {
    src: currentSrc,
    alt: `Follow-up photo for ${site.name} at ${activeTP?.timepoint}`,
    corners: {
      tl: `CURRENT · ${activeTP?.timepoint ?? "Date"}`,
      tr: der ? `REG ${der.quality.toUpperCase()} · ${der.inliers} pts` : "NOT ALIGNED",
      bl: `${currentPhoto.source.toUpperCase()}`,
      br: m
        ? `VEG ${Math.round((m.vegetationFractionBefore ?? 0) * 100)}→${Math.round(
            (m.vegetationFractionAfter ?? 0) * 100
          )}% · CHANGED ${Math.round((m.changedAreaFraction ?? 0) * 100)}% · L ${
            (m.brightnessShift ?? 0) > 0 ? "+" : ""
          }${Math.round(m.brightnessShift ?? 0)}`
        : undefined,
    },
  };

  const totalFlags = timepoints.flatMap((t) => t.photos.flatMap((p) => p.flags ?? [])).length;

  return (
    <div className="flex h-full flex-col">
      {/* 48px Header row */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-surface-1 px-4">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-semibold text-text">{site.name}</span>
          <span className="text-text-3">·</span>
          <span className="text-[12px] text-text-2">{project?.name ?? "Project"}</span>
          <span className="mono rounded-[2px] border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-3">
            {project?.type ?? "plantation"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[12px]">
          {totalFlags > 0 && (
            <div className="flex items-center gap-1.5 text-flag">
              <span className="mono">◆</span>
              <span>{totalFlags} flag{totalFlags > 1 ? "s" : ""}</span>
            </div>
          )}

          {agreement && (
            <div className="flex items-center gap-1.5 text-text-2">
              <span className="mono text-measure">✓</span>
              <span>Witnesses: {agreement.result}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Longitudinal Reading Room Station */}
      <div className="flex flex-1 min-h-0">
        <TimeAxis
          ticks={ticks}
          selected={activeTP?.timepoint ?? ""}
          onSelect={(tp) => {
            setSelectedTimepoint(tp);
            setSelectedPhotoId(null);
          }}
          projectType={project?.type as ProjectType ?? "plantation"}
        />

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="p-4">
            <HangingProtocol
              aspect={4 / 3}
              prior={priorHung}
              current={currentHung}
              differenceSrc={der?.differenceAssetId ? cld.plate(der.differenceAssetId, 1600) : null}
              inlierPoints={der?.inlierPoints ?? []}
            />
          </div>

          {/* Grade Strip */}
          <div className="mt-auto">
            <GradeStrip
              siteId={site.id}
              timepoint={activeTP?.timepoint ?? ""}
              projectType={project?.type as ProjectType ?? "plantation"}
              grade={activeTP?.grade ?? null}
              status={activeTP?.status ?? "pending"}
              decision={activeTP?.decision ?? null}
              onOpenSign={() => setSignOpen(true)}
              onSendToReview={() => router.push("/review")}
              onRetryGrade={async () => {
                await fetch(`/api/sites/${site.id}/assess`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ timepoint: activeTP?.timepoint }),
                });
                router.refresh();
              }}
            />

            {/* Timepoint photo thumbnail strip */}
            {activeTP && activeTP.photos.length > 1 && (
              <div className="flex items-center gap-2 border-t border-line bg-surface-0 px-4 py-2">
                <span className="mono text-[11px] text-text-3">Photos ({activeTP.photos.length}):</span>
                {activeTP.photos.map((p) => {
                  const isSelected = (selectedPhotoId ?? activeTP.source?.assetId) === p.assetId;
                  return (
                    <button
                      key={p.assetId}
                      onClick={() => setSelectedPhotoId(p.assetId)}
                      className={`relative size-12 shrink-0 border transition-all ${
                        isSelected ? "border-measure ring-1 ring-measure" : "border-line opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cld.thumb(p.assetId, 100)} alt="" className="size-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <SignReadingDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        siteId={site.id}
        timepoint={activeTP?.timepoint ?? ""}
        projectType={project?.type as ProjectType ?? "plantation"}
        modelGrade={activeTP?.grade ?? null}
        onSigned={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
