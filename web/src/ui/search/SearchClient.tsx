"use client";

import { useState, useEffect } from "react";
import { cld } from "@/ui/cld";
import { Button } from "@/ui/Button";
import { Drawer } from "@/ui/intake/Drawer";
import type { IntakeRow } from "@/ui/intake/useIntake";
import { Search as SearchIcon, Filter, AlertCircle, Sparkles } from "lucide-react";
import { PublicVideoDialog } from "@/ui/search/PublicVideoDialog";

interface SearchResultItem {
  assetId: string;
  row: any;
  score: number | null;
  thumbUrl?: string;
}

export function SearchClient({
  projectId,
  sites,
}: {
  projectId: string;
  sites: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [siteId, setSiteId] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [grade, setGrade] = useState("");
  const [flagged, setFlagged] = useState(false);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    reranked: boolean;
    items: SearchResultItem[];
  }>({ reranked: false, items: [] });

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  const siteMap = new Map(sites.map((s) => [s.id, s.name]));

  async function performSearch() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ projectId });
      if (query.trim()) params.set("query", query.trim());
      if (siteId) params.set("siteId", siteId);
      if (status) params.set("status", status);
      if (source) params.set("source", source);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (grade) params.set("grade", grade);
      if (flagged) params.set("flagged", "true");

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
      setSelectedIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    performSearch();
  }, []);

  // Keyboard navigation through results
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
        if (e.key === "Enter") {
          performSearch();
        }
        return;
      }

      if (!results.items.length) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(results.items.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(results.items.length - 1, prev + 4));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 4));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const active = results.items[selectedIndex];
        if (active) {
          setSelectedAssetId(active.assetId);
          setDrawerOpen(true);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [results.items, selectedIndex, query, siteId, status, source, from, to, grade, flagged]);

  // Convert selected search result to IntakeRow for Drawer
  const activeItem = selectedAssetId
    ? results.items.find((i) => i.assetId === selectedAssetId)
    : results.items[selectedIndex];

  const drawerRow: IntakeRow | null = activeItem
    ? {
        localId: activeItem.assetId,
        name: activeItem.row?.filename ?? activeItem.assetId,
        objectUrl: activeItem.row?.secureUrl ?? "",
        thumbUrl: activeItem.thumbUrl ?? cld.thumb(activeItem.assetId, 160),
        state: "decided",
        progress: 100,
        assetId: activeItem.assetId,
        siteId: activeItem.row?.siteId,
        siteName: activeItem.row?.siteId ? siteMap.get(activeItem.row.siteId) ?? null : null,
        relevance: activeItem.row?.relevance,
        activity: activeItem.row?.activity,
        status: activeItem.row?.status,
        statusReason: activeItem.row?.statusReason,
        flags: activeItem.row?.flags ?? [],
        sender: activeItem.row?.sender,
        sentAt: activeItem.row?.capturedAt ? new Date(activeItem.row.capturedAt).toISOString() : undefined,
        comment: activeItem.row?.comment,
      }
    : null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-0">
      {/* Top Search Bar & Filters */}
      <div className="border-b border-line bg-surface-1 p-6 space-y-4">
        {/* Search input */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. water point with people queueing, after June..."
              className="h-11 w-full rounded-[2px] border border-line bg-surface-0 pl-10 pr-4 text-[14px] text-text placeholder:text-text-3 focus:border-measure focus:outline-hidden"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="quiet" onClick={() => setVideoDialogOpen(true)} className="h-11 px-4">
              Analyse public video
            </Button>
            <Button variant="primary" onClick={performSearch} disabled={loading} className="h-11 px-5">
              {loading ? "Searching..." : "Search Evidence"}
            </Button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3 text-[12px]">
          <div className="flex items-center gap-1.5 text-text-3">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Site */}
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="rounded-[2px] border border-line bg-surface-0 px-2.5 py-1.5 text-text focus:border-measure focus:outline-hidden"
          >
            <option value="">All sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-[2px] border border-line bg-surface-0 px-2.5 py-1.5 text-text focus:border-measure focus:outline-hidden"
          >
            <option value="">All statuses</option>
            <option value="accepted">Accepted</option>
            <option value="needs_review">Needs review</option>
            <option value="set_aside">Set aside</option>
            <option value="pending">Pending</option>
          </select>

          {/* Source */}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-[2px] border border-line bg-surface-0 px-2.5 py-1.5 text-text focus:border-measure focus:outline-hidden"
          >
            <option value="">All sources</option>
            <option value="implementer">Implementer</option>
            <option value="witness">Witness</option>
            <option value="bulk_import">Bulk Import</option>
          </select>

          {/* Grade */}
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="rounded-[2px] border border-line bg-surface-0 px-2.5 py-1.5 text-text focus:border-measure focus:outline-hidden"
          >
            <option value="">Any SRC Grade</option>
            <option value="1">Grade 1</option>
            <option value="2">Grade 2</option>
            <option value="3">Grade 3</option>
            <option value="4">Grade 4</option>
            <option value="5">Grade 5</option>
          </select>

          {/* Integrity Flagged checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer text-text">
            <input
              type="checkbox"
              checked={flagged}
              onChange={(e) => setFlagged(e.target.checked)}
              className="accent-measure"
            />
            <span>Has integrity flag</span>
          </label>
        </div>
      </div>

      {/* Results Header Status Line */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-line bg-surface-1/50 px-6 font-mono text-[12px]">
        <div>
          {results.reranked ? (
            <span className="flex items-center gap-1.5 text-measure font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Ranked by Jev relevance ({results.items.length} checked)
            </span>
          ) : (
            <span className="text-text-3">
              Filters only (Jev unreachable or query blank) · {results.items.length} items
            </span>
          )}
        </div>

        <div className="text-text-3">
          Arrow keys navigate · <kbd className="rounded border border-line bg-surface-2 px-1">Enter</kbd> inspect
        </div>
      </div>

      {/* 160px Dense Plate Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {results.items.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center mono text-[13px] text-text-3">
            <AlertCircle className="h-8 w-8 mb-2 opacity-60" />
            <span>No matching evidence found. Try adjusting query or filters.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const dateStr = item.row?.capturedAt
                ? new Date(item.row.capturedAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })
                : "No date";
              const siteName = siteMap.get(item.row?.siteId ?? "") ?? item.row?.siteId ?? "Unassigned";

              return (
                <div
                  key={item.assetId}
                  role="button"
                  onClick={() => {
                    setSelectedIndex(idx);
                    setSelectedAssetId(item.assetId);
                    setDrawerOpen(true);
                  }}
                  className={`group relative flex flex-col cursor-pointer overflow-hidden rounded-[2px] border bg-surface-1 transition-all ${
                    isSelected
                      ? "border-measure ring-2 ring-measure/30 shadow-md"
                      : "border-line hover:border-text-3"
                  }`}
                >
                  {/* 160px plate image */}
                  <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
                    <img
                      src={item.thumbUrl ?? cld.thumb(item.assetId, 160)}
                      alt={item.assetId}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />

                    {/* Score badge if reranked */}
                    {item.score !== null && (
                      <div className="absolute top-1.5 right-1.5 rounded-[2px] bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-measure">
                        {Math.round(item.score * 100)}%
                      </div>
                    )}
                  </div>

                  {/* Caption line */}
                  <div className="p-2 space-y-0.5 font-mono text-[11px]">
                    <div className="truncate font-medium text-text" title={siteName}>
                      {siteName}
                    </div>
                    <div className="flex items-center justify-between text-text-3 text-[10px]">
                      <span>{dateStr}</span>
                      {item.row?.status && (
                        <span className="capitalize">{item.row.status.replace("_", " ")}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer */}
      <Drawer
        row={drawerRow}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelectAsset={(assetId) => {
          setSelectedAssetId(assetId);
          setDrawerOpen(true);
        }}
        onReviewed={() => {
          performSearch();
        }}
        onRetried={() => {
          performSearch();
        }}
        onDeleted={() => {
          performSearch();
        }}
      />
      {videoDialogOpen && (
        <PublicVideoDialog
          projectId={projectId}
          sites={sites}
          onClose={() => setVideoDialogOpen(false)}
          onComplete={() => {
            setVideoDialogOpen(false);
            performSearch();
          }}
        />
      )}
    </div>
  );
}
