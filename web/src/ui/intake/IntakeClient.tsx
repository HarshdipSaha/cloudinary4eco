"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useIntake, type IntakeRow } from "./useIntake";
import { WorklistRow } from "./WorklistRow";
import { Drawer } from "./Drawer";
import { Button } from "@/ui/Button";
import { UploadCloud, FolderUp, FileArchive } from "lucide-react";

type TabKey = "all" | "accepted" | "needs_review" | "set_aside" | "pending";

export function IntakeClient({
  projectId,
  initialRows = [],
}: {
  projectId: string;
  initialRows?: IntakeRow[];
}) {
  const { rows, totals, isProcessing, handleFiles, setRows } = useIntake(projectId);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  // Initialize with initial rows if any
  useEffect(() => {
    if (initialRows.length > 0 && rows.length === 0) {
      setRows(initialRows);
    }
  }, [initialRows]);

  // Combine rows and filter by tab
  const filteredRows = useMemo(() => {
    if (activeTab === "all") return rows;
    return rows.filter((r) => r.status === activeTab);
  }, [rows, activeTab]);

  // Tab counts
  const counts = useMemo(() => {
    const c = { all: rows.length, accepted: 0, needs_review: 0, set_aside: 0, pending: 0 };
    for (const r of rows) {
      if (r.status === "accepted") c.accepted++;
      else if (r.status === "needs_review") c.needs_review++;
      else if (r.status === "set_aside") c.set_aside++;
      else if (r.status === "pending" || r.state === "pending") c.pending++;
    }
    return c;
  }, [rows]);

  // Selected row
  const activeRow = useMemo(() => {
    if (selectedAssetId) {
      const found = rows.find((r) => r.assetId === selectedAssetId || r.localId === selectedAssetId);
      if (found) return found;
    }
    return filteredRows[selectedIndex] ?? null;
  }, [selectedAssetId, filteredRows, selectedIndex, rows]);

  // Keyboard navigation: J/K, Enter, A, S
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, filteredRows.length - 1)));
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Enter") {
        if (filteredRows[selectedIndex]) {
          e.preventDefault();
          setSelectedAssetId(filteredRows[selectedIndex].assetId ?? filteredRows[selectedIndex].localId);
          setIsDrawerOpen(true);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredRows, selectedIndex]);

  // File drop handling
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      handleFiles(Array.from(e.target.files));
    }
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative flex h-full flex-col bg-surface-0 ${
        isDragging ? "ring-2 ring-inset ring-measure" : ""
      }`}
    >
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.zip,.txt"
        className="hidden"
        onChange={onFileInputChange}
      />
      <input
        ref={dirInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard for folder picker
        webkitdirectory=""
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* Top Header: Running Measured Totals & Actions */}
      <div className="flex flex-wrap items-center justify-between border-b border-line bg-surface-1 px-4 py-2.5">
        {/* Measured Metrics */}
        <div className="mono flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-text-2">
          <div>
            <span className="text-text-3">Processed: </span>
            <span className="font-semibold text-text">{rows.length}</span>
          </div>
          <div>
            <span className="text-text-3">Elapsed: </span>
            <span className="text-text">{totals.elapsedSec}s</span>
          </div>
          <div>
            <span className="text-text-3">Jev decisions: </span>
            <span className="text-text">{totals.decisions}</span>
          </div>
          <div>
            <span className="text-text-3">Tokens: </span>
            <span className="text-text">{totals.inputTokens.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-text-3">Cost: </span>
            <span className="text-measure font-medium">
              ${totals.usd.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Upload Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="quiet"
            onClick={() => dirInputRef.current?.click()}
            disabled={isProcessing}
            className="gap-1.5 text-[12px]"
          >
            <FolderUp className="h-3.5 w-3.5" />
            Folder
          </Button>
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="gap-1.5 text-[12px]"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            {isProcessing ? "Processing..." : "Import Photos / ZIP"}
          </Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex h-10 items-center justify-between border-b border-line bg-surface-1/50 px-4">
        <div className="flex items-center gap-1">
          {(
            [
              { key: "all", label: "All" },
              { key: "accepted", label: "Accepted" },
              { key: "needs_review", label: "Needs review" },
              { key: "set_aside", label: "Set aside" },
              { key: "pending", label: "Pending" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSelectedIndex(0);
              }}
              className={`flex h-8 items-center gap-1.5 rounded-[2px] px-3 text-[12px] font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-surface-2 text-text shadow-xs"
                  : "text-text-3 hover:text-text hover:bg-surface-2/50"
              }`}
            >
              <span>{tab.label}</span>
              <span className="mono text-[11px] opacity-75">
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="mono text-[11px] text-text-3">
          <kbd className="rounded border border-line bg-surface-2 px-1">J</kbd>/
          <kbd className="rounded border border-line bg-surface-2 px-1">K</kbd> navigate ·{" "}
          <kbd className="rounded border border-line bg-surface-2 px-1">Enter</kbd> inspect
        </div>
      </div>

      {/* Main Worklist or Empty Dropzone */}
      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex h-full min-h-[360px] cursor-pointer flex-col items-center justify-center p-8 text-center hover:bg-surface-1/30 transition-colors"
          >
            <div className="rounded-full border border-line bg-surface-1 p-4 mb-4">
              <FileArchive className="h-8 w-8 text-measure" />
            </div>
            <h3 className="text-base font-semibold text-text">
              Drop photos, a folder, or a WhatsApp chat export (.zip)
            </h3>
            <p className="mt-1 max-w-sm text-[13px] text-text-2">
              SAAKSHYA automatically unpacks images, extracts timestamps and senders from
              chat metadata, runs Cloudinary perception, and triages sites with TypeSafe Jev.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="primary">
                Choose files
              </Button>
              <Button
                variant="quiet"
                onClick={(e) => {
                  e.stopPropagation();
                  dirInputRef.current?.click();
                }}
              >
                Choose directory
              </Button>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-center mono text-[12px] text-text-3">
            No photos in tab &quot;{activeTab}&quot;
          </div>
        ) : (
          <div className="divide-y divide-line">
            {filteredRows.map((row, idx) => (
              <WorklistRow
                key={row.assetId ?? row.localId}
                row={row}
                isSelected={idx === selectedIndex}
                onClick={() => {
                  setSelectedIndex(idx);
                  setSelectedAssetId(row.assetId ?? row.localId);
                  setIsDrawerOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer
        row={activeRow}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectAsset={(assetId) => {
          setSelectedAssetId(assetId);
          setIsDrawerOpen(true);
        }}
        onReviewed={(assetId, action, siteId, reason) => {
          setRows((prev) =>
            prev.map((r) =>
              r.assetId === assetId
                ? {
                    ...r,
                    status: action === "accept" ? "accepted" : action === "set_aside" ? "set_aside" : r.status,
                    siteId: action === "assign_site" ? siteId : r.siteId,
                    statusReason: reason ? `Reviewer: ${reason}` : r.statusReason,
                  }
                : r
            )
          );
        }}
        onRetried={(assetId, result) => {
          setRows((prev) =>
            prev.map((r) =>
              r.assetId === assetId
                ? {
                    ...r,
                    status: result.status,
                    statusReason: result.statusReason,
                    state: result.status === "pending" ? "pending" : "decided",
                  }
                : r
            )
          );
        }}
        onDeleted={(assetId) => {
          setRows((prev) => prev.filter((r) => r.assetId !== assetId));
          setSelectedAssetId(null);
        }}
      />
    </div>
  );
}
