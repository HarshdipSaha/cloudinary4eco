"use client";

import type { IntakeRow } from "./useIntake";
import { StatusMark, FlagMark } from "@/ui/marks";
import type { EvidenceStatus, FlagKind } from "@/domain/types";
import { cld } from "@/ui/cld";

export function WorklistRow({
  row,
  isSelected,
  onClick,
}: {
  row: IntakeRow;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isSetAside = row.status === "set_aside";
  const thumbSrc =
    row.thumbUrl ??
    (row.assetId ? cld.thumb(row.assetId, 44) : row.objectUrl || undefined);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ contentVisibility: "auto" }}
      className={`group relative flex h-14 w-full cursor-pointer items-center border-b border-line px-3 text-left transition-colors select-none settle ${
        isSelected
          ? "bg-surface-2 border-l-2 border-l-measure"
          : "hover:bg-surface-1 border-l-2 border-l-transparent"
      }`}
    >
      {/* 12-column grid layout */}
      <div className="grid w-full grid-cols-12 items-center gap-3">
        {/* Thumb (Col 1) */}
        <div className="col-span-1 flex items-center">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[2px] border border-line bg-surface-2">
            {thumbSrc ? (
              <img
                src={thumbSrc}
                alt={row.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center mono text-[10px] text-text-3">
                {row.state === "uploading" ? `${row.progress}%` : "..."}
              </div>
            )}
            {row.state === "uploading" && (
              <div
                className="absolute bottom-0 left-0 h-0.5 bg-measure transition-all"
                style={{ width: `${row.progress}%` }}
              />
            )}
          </div>
        </div>

        {/* Filename, sender, sent time (Cols 2-5) */}
        <div className="col-span-4 min-w-0 pr-2">
          <div
            className={`mono truncate text-[13px] font-medium text-text ${
              isSetAside ? "line-through text-text-3" : ""
            }`}
            title={row.name}
          >
            {row.name}
          </div>
          <div className="truncate text-[11px] text-text-2">
            {row.sender ? (
              <span>{row.sender}</span>
            ) : (
              <span className="text-text-3">Unknown sender</span>
            )}
            {row.sentAt && (
              <>
                <span className="mx-1.5 text-text-3">·</span>
                <span className="mono">
                  {new Date(row.sentAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Site + confidence (Cols 6-7) */}
        <div className="col-span-2 min-w-0 pr-2">
          {row.siteName || row.siteId ? (
            <div>
              <div className="truncate text-[12px] text-text">
                {row.siteName ?? row.siteId}
              </div>
              {typeof row.siteConfidence === "number" && (
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="h-1 w-12 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full bg-measure"
                      style={{ width: `${Math.round(row.siteConfidence * 100)}%` }}
                    />
                  </div>
                  <span className="mono text-[10px] text-text-3">
                    {Math.round(row.siteConfidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="mono text-[11px] text-text-3">
              {row.state === "analyzing" || row.state === "queued" ? "matching..." : "Unassigned"}
            </span>
          )}
        </div>

        {/* Activity (Col 8) */}
        <div className="col-span-2 min-w-0 pr-2">
          {row.activity ? (
            <span className="truncate text-[12px] text-text-2" title={row.activity}>
              {row.activity}
            </span>
          ) : (
            <span className="text-[12px] text-text-3">—</span>
          )}
        </div>

        {/* Flags (Cols 9-10) */}
        <div className="col-span-1 min-w-0 flex flex-wrap gap-1 overflow-hidden">
          {row.flags && row.flags.length > 0 ? (
            row.flags.slice(0, 2).map((f, i) => (
              <FlagMark key={i} kind={f.kind as FlagKind} detail={f.detail} />
            ))
          ) : (
            <span className="text-[11px] text-text-3">—</span>
          )}
        </div>

        {/* Status mark + reason (Cols 11-12) */}
        <div className="col-span-2 min-w-0 pl-1 text-right">
          {row.state === "uploading" ? (
            <span className="mono text-[11px] text-measure">
              uploading {row.progress}%
            </span>
          ) : row.state === "error" ? (
            <span className="mono text-[11px] text-flag" title={row.error}>
              Upload failed
            </span>
          ) : row.status ? (
            <div className="inline-flex flex-col items-end">
              <StatusMark
                status={row.status as EvidenceStatus}
                reason={row.statusReason}
              />
              {row.statusReason && (
                <span
                  className="max-w-[140px] truncate text-[10px] text-text-3"
                  title={row.statusReason}
                >
                  {row.statusReason}
                </span>
              )}
            </div>
          ) : row.state === "analyzing" ? (
            <span className="mono text-[11px] text-attention">analyzing...</span>
          ) : (
            <span className="mono text-[11px] text-text-3">queued</span>
          )}
        </div>
      </div>
    </div>
  );
}
