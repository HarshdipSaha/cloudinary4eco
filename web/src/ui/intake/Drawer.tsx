"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { IntakeRow } from "./useIntake";
import { Plate } from "@/ui/hanging/Plate";
import { cld } from "@/ui/cld";
import { ProbabilityBar } from "@/ui/ProbabilityBar";
import { FlagMark, StatusMark } from "@/ui/marks";
import type { EvidenceStatus, FlagKind } from "@/domain/types";
import { Button } from "@/ui/Button";
import { X, Check, Ban, MapPin, Trash2 } from "lucide-react";

interface DecisionRecord {
  id: number;
  kind: string;
  question: any;
  answer: any;
  confidence: number | null;
  probabilities: Record<string, number> | null;
  model: string | null;
  latencyMs: number | null;
  reason: string | null;
}

export function Drawer({
  row,
  isOpen,
  onClose,
  onSelectAsset,
  onReviewed,
  onDeleted,
}: {
  row: IntakeRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (assetId: string) => void;
  onReviewed: (assetId: string, action: string, siteId?: string, reason?: string) => void;
  onDeleted: (assetId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<{
    evidence: any;
    publicVideoImport: any;
    decisions: DecisionRecord[];
    derivative: any;
    site: any;
    sites: { id: string; name: string }[];
  } | null>(null);

  const [reviewMode, setReviewMode] = useState<"accept" | "set_aside" | "assign_site" | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [reviewReason, setReviewReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!row?.assetId || !isOpen) {
      setDetail(null);
      setReviewMode(null);
      setReviewReason("");
      setSubmitError(null);
      return;
    }

    let active = true;
    setLoading(true);
    fetch(`/api/review/${row.assetId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load details");
        return res.json();
      })
      .then((data) => {
        if (active) {
          setDetail(data);
          if (data.evidence?.siteId) setSelectedSiteId(data.evidence.siteId);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [row?.assetId, isOpen]);

  if (!row) return null;

  async function handleReviewSubmit() {
    if (!reviewMode || !row?.assetId) return;
    if (!reviewReason.trim()) {
      setSubmitError("A reason is required for every review action");
      return;
    }
    if (reviewMode === "assign_site" && !selectedSiteId) {
      setSubmitError("Please select a target site");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/review/${row.assetId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: reviewMode,
          siteId: reviewMode === "assign_site" ? selectedSiteId : undefined,
          reason: reviewReason,
          actor: "reviewer",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      onReviewed(row.assetId, reviewMode, selectedSiteId, reviewReason);
      setReviewMode(null);
      setReviewReason("");
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!row?.assetId || !window.confirm(`Permanently delete “${row.name}”? This cannot be undone.`)) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/review/${row.assetId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      onDeleted(row.assetId);
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePublicVideoImport() {
    const importId = detail?.publicVideoImport?.id;
    if (!importId || !row?.assetId || !window.confirm("Delete this public video and all extracted frames? This cannot be undone.")) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/public-video/${importId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Video import deletion failed");
      }
      onDeleted(row.assetId);
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const ev = detail?.evidence;
  const missingSignals = ev?.missingSignals ?? row.error ? ["analysis_unavailable"] : [];
  const captureTime = ev?.capturedAt ?? row.sentAt;
  const captureSource = ev?.flags?.some((f: any) => f.kind === "capture_time_from_chat")
    ? "WhatsApp chat message time"
    : "Camera EXIF";

  const imgUrl = row.assetId ? cld.plate(row.assetId, 800) : row.objectUrl;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity" />
        <Dialog.Content
          aria-describedby="drawer-description"
          className="fixed inset-y-0 right-0 z-50 flex h-full w-[480px] max-w-full flex-col border-l border-line bg-surface-1 shadow-2xl focus:outline-hidden"
        >
          {/* Header */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
            <div className="flex items-center gap-2 min-w-0">
              <Dialog.Title className="mono truncate text-[13px] font-medium text-text">
                {row.name}
              </Dialog.Title>
              {row.status && (
                <StatusMark
                  status={row.status as EvidenceStatus}
                  reason={row.statusReason}
                />
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="text-text-3 hover:text-text p-1 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div id="drawer-description" className="sr-only">
            Evidence dossier for {row.name}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* 1. Plate */}
            <div>
              <Plate
                aspect={4 / 3}
                label={row.name}
                corners={{
                  tl: row.siteName ?? ev?.siteId ?? "Unassigned",
                  tr: captureTime ? new Date(captureTime).toLocaleDateString() : undefined,
                  bl: row.assetId ? row.assetId.slice(0, 16) : "local",
                  br: ev?.faceCount ? `${ev.faceCount} face${ev.faceCount > 1 ? "s" : ""}` : undefined,
                }}
              >
                <img
                  src={imgUrl}
                  alt={row.name}
                  className="h-full w-full object-contain"
                />
              </Plate>
            </div>

            {/* 2. Cloudinary Analysis */}
            <div className="space-y-2 rounded-[2px] border border-line bg-surface-0 p-3 text-[12px]">
              <div className="mono text-[11px] font-semibold tracking-wider text-text-3 uppercase">
                Cloudinary Perception
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-text-3">Caption: </span>
                  <span className="text-text">
                    {ev?.caption ?? (
                      <span className="text-text-3 italic">
                        No caption: captioning add-on not available
                      </span>
                    )}
                  </span>
                </div>
                {ev?.tags && ev.tags.length > 0 && (
                  <div>
                    <span className="text-text-3">Tags: </span>
                    <span className="text-text">{ev.tags.join(", ")}</span>
                  </div>
                )}
                {ev?.ocrText && (
                  <div>
                    <span className="text-text-3">OCR: </span>
                    <span className="mono text-[11px] text-text">{ev.ocrText}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-text-3">GPS: </span>
                    {ev?.lat && ev?.lon ? (
                      <span className="mono text-text">
                        {ev.lat.toFixed(5)}, {ev.lon.toFixed(5)}
                      </span>
                    ) : (
                      <span className="text-text-3 italic">Not recorded in EXIF</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-text-3">Capture time: </span>
                  {captureTime ? (
                    <span className="text-text">
                      <span className="mono">{new Date(captureTime).toLocaleString()}</span>
                      <span className="text-text-3 ml-1.5">({captureSource})</span>
                    </span>
                  ) : (
                    <span className="text-text-3 italic">Unknown</span>
                  )}
                </div>
                {missingSignals.length > 0 && (
                  <div className="text-[11px] text-text-3">
                    Missing signals: {missingSignals.join(", ")}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Jev Decisions */}
            {detail?.publicVideoImport && (
              <div className="space-y-2 rounded-[2px] border border-line bg-surface-0 p-3 text-[12px]">
                <div className="mono text-[11px] font-semibold tracking-wider text-text-3 uppercase">Public video source</div>
                <a href={detail.publicVideoImport.sourceUrl} target="_blank" rel="noreferrer" className="break-all text-measure underline underline-offset-2">
                  {detail.publicVideoImport.sourceUrl}
                </a>
                <div className="mono text-[11px] text-text-3">
                  Frame {ev?.frameSecond ?? 0}s · capture time and GPS unavailable unless separately verified.
                </div>
                <div className="text-[11px] text-text-3">Delete the entire import to remove this shared video and its frames.</div>
                <Button variant="quiet" onClick={handleDeletePublicVideoImport} disabled={submitting} className="gap-1.5 text-flag hover:border-flag/60">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete video import
                </Button>
              </div>
            )}

            {/* 3. Jev Decisions */}
            <div className="space-y-3">
              <div className="mono text-[11px] font-semibold tracking-wider text-text-3 uppercase">
                Calibrated Decisions (Jev)
              </div>
              {detail?.decisions && detail.decisions.length > 0 ? (
                detail.decisions.map((d) => (
                  <div
                    key={d.id}
                    className="space-y-1.5 rounded-[2px] border border-line bg-surface-0 p-3 text-[12px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="mono font-medium text-text capitalize">
                        {d.kind.replace("_", " ")}
                      </span>
                      <span className="mono text-[11px] text-text-3">
                        {d.model} · {d.latencyMs}ms
                      </span>
                    </div>
                    {d.probabilities && (
                      <ProbabilityBar
                        probabilities={d.probabilities}
                        chosen={String(d.answer)}
                      />
                    )}
                    {d.reason && (
                      <div className="text-[11px] text-text-2 mt-1">
                        {d.reason}
                      </div>
                    )}
                  </div>
                ))
              ) : loading ? (
                <div className="mono text-[12px] text-text-3">Loading decisions...</div>
              ) : (
                <div className="mono text-[12px] text-text-3">
                  {row.relevance ? (
                    <span>Relevance: {row.relevance}</span>
                  ) : (
                    "No calibrated decisions recorded."
                  )}
                </div>
              )}
            </div>

            {/* 4. Flags & Related Asset Thumbs */}
            {((row.flags && row.flags.length > 0) || (ev?.flags && ev.flags.length > 0)) && (
              <div className="space-y-2">
                <div className="mono text-[11px] font-semibold tracking-wider text-text-3 uppercase">
                  Integrity & Quality Flags
                </div>
                <div className="space-y-2">
                  {(ev?.flags ?? row.flags).map((f: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-[2px] border border-line bg-surface-0 p-2.5 space-y-1.5 text-[12px]"
                    >
                      <div className="flex items-center gap-2">
                        <FlagMark kind={f.kind as FlagKind} detail={f.detail} />
                      </div>
                      <p className="text-text-2 text-[11px]">{f.detail}</p>
                      {f.relatedAssetIds && f.relatedAssetIds.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] text-text-3 block mb-1">
                            Related evidence:
                          </span>
                          <div className="flex gap-2">
                            {f.relatedAssetIds.map((relId: string) => (
                              <button
                                key={relId}
                                onClick={() => onSelectAsset(relId)}
                                className="group relative h-10 w-10 overflow-hidden rounded-[2px] border border-line bg-surface-2 hover:border-measure"
                                title={`Open related asset ${relId}`}
                              >
                                <img
                                  src={cld.thumb(relId, 40)}
                                  alt={relId}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Review Actions */}
            {row.assetId && (
              <div className="space-y-3 pt-2 border-t border-line">
                <div className="mono text-[11px] font-semibold tracking-wider text-text-3 uppercase">
                  Review & Actions
                </div>

                {!reviewMode ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => setReviewMode("accept")}
                      className="gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5 text-surface-0" />
                      Accept
                    </Button>
                    <Button
                      variant="quiet"
                      onClick={() => setReviewMode("set_aside")}
                      className="gap-1.5 text-flag hover:border-flag/60"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Set aside
                    </Button>
                    <Button
                      variant="quiet"
                      onClick={() => setReviewMode("assign_site")}
                      className="gap-1.5"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Assign site
                    </Button>
                    {!ev?.videoImportId && (
                      <Button
                        variant="quiet"
                        onClick={handleDelete}
                        disabled={submitting}
                        className="gap-1.5 text-flag hover:border-flag/60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete photo
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 rounded-[2px] border border-line bg-surface-0 p-3">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[12px] font-medium text-text capitalize">
                        Action: {reviewMode.replace("_", " ")}
                      </span>
                      <button
                        onClick={() => {
                          setReviewMode(null);
                          setSubmitError(null);
                        }}
                        className="text-[11px] text-text-3 hover:text-text"
                      >
                        Cancel
                      </button>
                    </div>

                    {reviewMode === "assign_site" && detail?.sites && (
                      <div>
                        <label className="text-[11px] text-text-3 block mb-1">
                          Select Site
                        </label>
                        <select
                          value={selectedSiteId}
                          onChange={(e) => setSelectedSiteId(e.target.value)}
                          className="w-full rounded-[2px] border border-line bg-surface-1 px-2.5 py-1.5 text-[12px] text-text focus:border-measure focus:outline-hidden"
                        >
                          <option value="">Choose a site...</option>
                          {detail.sites.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] text-text-3 block mb-1">
                        Reason for review override (required)
                      </label>
                      <textarea
                        value={reviewReason}
                        onChange={(e) => setReviewReason(e.target.value)}
                        placeholder="Provide reason for audit log..."
                        rows={2}
                        className="w-full rounded-[2px] border border-line bg-surface-1 p-2 text-[12px] text-text placeholder:text-text-3 focus:border-measure focus:outline-hidden"
                      />
                    </div>

                    {submitError && (
                      <div className="text-[11px] text-flag">{submitError}</div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="quiet"
                        onClick={() => {
                          setReviewMode(null);
                          setSubmitError(null);
                        }}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button

                        variant="primary"
                        onClick={handleReviewSubmit}
                        disabled={submitting || !reviewReason.trim()}
                      >
                        {submitting ? "Saving..." : "Confirm Action"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
