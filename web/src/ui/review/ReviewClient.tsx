"use client";

import { useState, useEffect } from "react";
import type { ReviewQueueItem } from "@/ledger/repo";
import type { ProjectType, FlagKind, EvidenceStatus } from "@/domain/types";
import { HangingProtocol, type HungImage } from "@/ui/hanging/HangingProtocol";
import { Plate } from "@/ui/hanging/Plate";
import { cld } from "@/ui/cld";
import { FlagMark, StatusMark } from "@/ui/marks";
import { ProbabilityBar } from "@/ui/ProbabilityBar";
import { Button } from "@/ui/Button";
import { Empty } from "@/ui/Empty";
import { GradeStrip } from "@/ui/site/GradeStrip";
import { SignReadingDialog } from "@/ui/site/SignReadingDialog";
import { Check, Ban, MapPin, ShieldAlert, AlertTriangle, Award } from "lucide-react";

export function ReviewClient({
  projectId,
  projectType,
  initialQueue,
}: {
  projectId: string;
  projectType: ProjectType;
  initialQueue: ReviewQueueItem[];
}) {
  const [queue, setQueue] = useState<ReviewQueueItem[]>(initialQueue);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Evidence detail loading
  const [evidenceDetail, setEvidenceDetail] = useState<{
    evidence: any;
    decisions: any[];
    derivative: any;
    site: any;
    sites: { id: string; name: string }[];
  } | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  // Review action state
  const [reviewMode, setReviewMode] = useState<"accept" | "set_aside" | "assign_site" | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Grade signing dialog state
  const [signDialogOpen, setSignDialogOpen] = useState(false);

  const activeItem = queue[selectedIndex] ?? null;

  // Load evidence details when an evidence item is active
  useEffect(() => {
    if (!activeItem || activeItem.kind !== "evidence") {
      setEvidenceDetail(null);
      setReviewMode(null);
      setReviewReason("");
      setActionError(null);
      return;
    }

    const assetId = activeItem.row.assetId;
    let active = true;
    setLoadingEvidence(true);
    setReviewMode(null);
    setReviewReason("");
    setActionError(null);

    fetch(`/api/review/${assetId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load evidence");
        return res.json();
      })
      .then((data) => {
        if (active) {
          setEvidenceDetail(data);
          if (data.evidence?.siteId) setSelectedSiteId(data.evidence.siteId);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setLoadingEvidence(false);
      });

    return () => {
      active = false;
    };
  }, [activeItem]);

  function advanceQueue() {
    setQueue((prev) => {
      const next = prev.filter((_, idx) => idx !== selectedIndex);
      return next;
    });
    setSelectedIndex((prev) => (prev >= queue.length - 1 ? Math.max(0, queue.length - 2) : prev));
  }

  async function handleReviewSubmit() {
    if (!activeItem || activeItem.kind !== "evidence" || !reviewMode) return;
    const assetId = activeItem.row.assetId;
    if (!reviewReason.trim()) {
      setActionError("A reason is required for every review action");
      return;
    }
    if (reviewMode === "assign_site" && !selectedSiteId) {
      setActionError("Please select a target site");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/review/${assetId}`, {
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

      setReviewMode(null);
      setReviewReason("");
      advanceQueue();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  type EvidenceQueueItem = Extract<ReviewQueueItem, { kind: "evidence" }>;
  type GradeQueueItem = Extract<ReviewQueueItem, { kind: "grade" }>;

  const integrityItems = queue.filter(
    (i): i is EvidenceQueueItem => i.kind === "evidence" && i.group === "integrity"
  );
  const lowConfidenceItems = queue.filter(
    (i): i is EvidenceQueueItem => i.kind === "evidence" && i.group === "low_confidence"
  );
  const gradeItems = queue.filter((i): i is GradeQueueItem => i.kind === "grade");


  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-0">
      {/* Left Pane: Queue List (360px) */}
      <div className="flex h-full w-[360px] shrink-0 flex-col border-r border-line bg-surface-1">
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2">
            <span className="mono text-[13px] font-semibold text-text">Review Queue</span>
            <span className="mono rounded-[2px] bg-surface-2 px-1.5 py-0.5 text-[11px] text-measure">
              {queue.length}
            </span>
          </div>
          <span className="mono text-[11px] text-text-3">Integrity first</span>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="p-6 text-center mono text-[12px] text-text-3">
              Queue clear. No pending reviews.
            </div>
          ) : (
            <div className="divide-y divide-line">
              {/* Group 1: Integrity Flags */}
              {integrityItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 bg-surface-2/60 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-flag uppercase">
                    <ShieldAlert className="h-3 w-3" />
                    <span>Integrity Flags ({integrityItems.length})</span>
                  </div>
                  {integrityItems.map((item) => {
                    const idx = queue.indexOf(item);
                    const row = item.row;
                    return (
                      <div
                        key={row.assetId}
                        role="button"
                        onClick={() => setSelectedIndex(idx)}
                        className={`flex cursor-pointer items-center gap-3 border-b border-line p-3 transition-colors ${
                          idx === selectedIndex
                            ? "bg-surface-2 border-l-2 border-l-measure"
                            : "hover:bg-surface-2/40 border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[2px] border border-line bg-surface-3">
                          <img
                            src={cld.thumb(row.assetId, 40)}
                            alt={row.assetId}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mono truncate text-[12px] font-medium text-text">
                            {row.filename ?? row.assetId}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {row.flags?.slice(0, 1).map((f: any, i: number) => (
                              <FlagMark key={i} kind={f.kind as FlagKind} detail={f.detail} />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Group 2: Low Confidence */}
              {lowConfidenceItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 bg-surface-2/60 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-attention uppercase">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Low Confidence ({lowConfidenceItems.length})</span>
                  </div>
                  {lowConfidenceItems.map((item) => {
                    const idx = queue.indexOf(item);
                    const row = item.row;
                    return (
                      <div
                        key={row.assetId}
                        role="button"
                        onClick={() => setSelectedIndex(idx)}
                        className={`flex cursor-pointer items-center gap-3 border-b border-line p-3 transition-colors ${
                          idx === selectedIndex
                            ? "bg-surface-2 border-l-2 border-l-measure"
                            : "hover:bg-surface-2/40 border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[2px] border border-line bg-surface-3">
                          <img
                            src={cld.thumb(row.assetId, 40)}
                            alt={row.assetId}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mono truncate text-[12px] font-medium text-text">
                            {row.filename ?? row.assetId}
                          </div>
                          <div className="truncate text-[11px] text-text-3">
                            {row.statusReason ?? "Decision uncertain"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Group 3: Grades to Confirm */}
              {gradeItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 bg-surface-2/60 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-measure uppercase">
                    <Award className="h-3 w-3" />
                    <span>Grades to Confirm ({gradeItems.length})</span>
                  </div>
                  {gradeItems.map((item) => {
                    const idx = queue.indexOf(item);
                    return (
                      <div
                        key={`${item.site.id}@${item.assessment.timepoint}`}
                        role="button"
                        onClick={() => setSelectedIndex(idx)}
                        className={`flex cursor-pointer items-center justify-between border-b border-line p-3 transition-colors ${
                          idx === selectedIndex
                            ? "bg-surface-2 border-l-2 border-l-measure"
                            : "hover:bg-surface-2/40 border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate text-[12px] font-medium text-text">
                            {item.site.name}
                          </div>
                          <div className="mono text-[11px] text-text-3">
                            {item.assessment.timepoint}
                          </div>
                        </div>
                        <div className="mono text-right text-[12px] font-semibold text-attention">
                          Grade {item.assessment.grade ?? "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Selected Item Viewer & Actions */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {!activeItem ? (
          <div className="flex h-full items-center justify-center p-8">
            <Empty message="Review queue is empty. All flagged items have been resolved." />
          </div>
        ) : activeItem.kind === "evidence" ? (
          <div className="flex flex-col p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="mono text-base font-semibold text-text">
                  {activeItem.row.filename ?? activeItem.row.assetId}
                </h2>
                <div className="text-[12px] text-text-3">
                  <span>Site: {evidenceDetail?.site?.name ?? activeItem.row.siteId ?? "Unassigned"}</span>
                  <span className="mx-2">·</span>
                  <StatusMark
                    status={activeItem.row.status as EvidenceStatus}
                    reason={activeItem.row.statusReason}
                  />
                </div>
              </div>
            </div>

            {/* Viewer: HangingProtocol if baseline+derivative exists, else single Plate */}
            <div>
              {evidenceDetail?.derivative?.baselineAssetId ? (
                <div className="max-w-4xl">
                  <HangingProtocol
                    aspect={4 / 3}
                    prior={{
                      src: cld.plate(evidenceDetail.derivative.baselineAssetId, 800),
                      alt: "Baseline photo",
                      corners: {
                        tl: "Baseline",
                        bl: evidenceDetail.derivative.baselineAssetId.slice(0, 16),
                      },
                    }}
                    current={{
                      src: evidenceDetail.derivative.alignedAssetId
                        ? cld.plate(evidenceDetail.derivative.alignedAssetId, 800)
                        : cld.plate(activeItem.row.assetId, 800),
                      alt: "Follow-up photo",
                      corners: {
                        tl: "Follow-up (Aligned)",
                        tr: activeItem.row.capturedAt
                          ? new Date(activeItem.row.capturedAt).toLocaleDateString()
                          : undefined,
                        bl: activeItem.row.assetId.slice(0, 16),
                      },
                    }}
                    differenceSrc={
                      evidenceDetail.derivative.differenceAssetId
                        ? cld.plate(evidenceDetail.derivative.differenceAssetId, 800)
                        : null
                    }
                    inlierPoints={evidenceDetail.derivative.inlierPoints ?? []}
                  />
                </div>
              ) : (
                <div className="max-w-2xl">
                  <Plate
                    aspect={4 / 3}
                    label={activeItem.row.filename ?? activeItem.row.assetId}
                    corners={{
                      tl: evidenceDetail?.site?.name ?? "Evidence",
                      bl: activeItem.row.assetId.slice(0, 16),
                    }}
                  >
                    <img
                      src={cld.plate(activeItem.row.assetId, 800)}
                      alt={activeItem.row.assetId}
                      className="h-full w-full object-contain"
                    />
                  </Plate>
                </div>
              )}
            </div>

            {/* Flags & Decisions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Flags */}
              <div className="rounded-[2px] border border-line bg-surface-1 p-3 space-y-2">
                <div className="mono text-[11px] font-semibold text-text-3 uppercase tracking-wider">
                  Flags & Concerns
                </div>
                {activeItem.row.flags && activeItem.row.flags.length > 0 ? (
                  activeItem.row.flags.map((f: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <FlagMark kind={f.kind as FlagKind} detail={f.detail} />
                      <p className="text-[12px] text-text-2">{f.detail}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-text-3">No flags recorded.</div>
                )}
              </div>

              {/* Calibrated Decisions */}
              <div className="rounded-[2px] border border-line bg-surface-1 p-3 space-y-2">
                <div className="mono text-[11px] font-semibold text-text-3 uppercase tracking-wider">
                  Calibrated Decisions
                </div>
                {evidenceDetail?.decisions && evidenceDetail.decisions.length > 0 ? (
                  evidenceDetail.decisions.map((d: any) => (
                    <div key={d.id} className="space-y-1 text-[12px]">
                      <div className="flex justify-between mono text-[11px] text-text-3">
                        <span className="capitalize">{d.kind}</span>
                        <span>{d.model}</span>
                      </div>
                      {d.probabilities && (
                        <ProbabilityBar
                          probabilities={d.probabilities}
                          chosen={String(d.answer)}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-text-3">
                    {loadingEvidence ? "Loading decisions..." : "No decisions recorded."}
                  </div>
                )}
              </div>
            </div>

            {/* Review Action Controls */}
            <div className="rounded-[2px] border border-line bg-surface-1 p-4 space-y-3">
              <div className="mono text-[11px] font-semibold text-text-3 uppercase tracking-wider">
                Auditor Determination
              </div>

              {!reviewMode ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    onClick={() => setReviewMode("accept")}
                    className="gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5 text-surface-0" />
                    Accept as valid evidence
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
                    Reassign site
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 rounded-[2px] border border-line bg-surface-0 p-3">
                  <div className="flex items-center justify-between">
                    <span className="mono text-[12px] font-medium text-text capitalize">
                      Confirm {reviewMode.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => {
                        setReviewMode(null);
                        setActionError(null);
                      }}
                      className="text-[11px] text-text-3 hover:text-text"
                    >
                      Cancel
                    </button>
                  </div>

                  {reviewMode === "assign_site" && evidenceDetail?.sites && (
                    <div>
                      <label className="text-[11px] text-text-3 block mb-1">
                        Select Correct Site
                      </label>
                      <select
                        value={selectedSiteId}
                        onChange={(e) => setSelectedSiteId(e.target.value)}
                        className="w-full rounded-[2px] border border-line bg-surface-1 px-2.5 py-1.5 text-[12px] text-text focus:border-measure focus:outline-hidden"
                      >
                        <option value="">Choose site...</option>
                        {evidenceDetail.sites.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-text-3 block mb-1">
                      Reason for determination (mandatory for audit trail)
                    </label>
                    <textarea
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      placeholder="Explain findings..."
                      rows={2}
                      className="w-full rounded-[2px] border border-line bg-surface-1 p-2 text-[12px] text-text placeholder:text-text-3 focus:border-measure focus:outline-hidden"
                    />
                  </div>

                  {actionError && (
                    <div className="text-[11px] text-flag">{actionError}</div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="quiet"
                      onClick={() => {
                        setReviewMode(null);
                        setActionError(null);
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
                      {submitting ? "Saving..." : "Record Decision & Next"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Grade Item Viewer */
          <div className="flex flex-col p-6 space-y-6">
            <div className="border-b border-line pb-3">
              <h2 className="text-lg font-semibold text-text">
                Grade Confirmation: {activeItem.site.name}
              </h2>
              <div className="mono text-[12px] text-text-3">
                Timepoint: {activeItem.assessment.timepoint}
              </div>
            </div>

            <div className="max-w-2xl rounded-[2px] border border-line bg-surface-1 p-4">
              <GradeStrip
                siteId={activeItem.site.id}
                timepoint={activeItem.assessment.timepoint}
                projectType={projectType}
                grade={activeItem.assessment.grade}
                status={activeItem.assessment.status}
                decision={null}
                onOpenSign={() => setSignDialogOpen(true)}
                onSendToReview={() => {}}
                onRetryGrade={() => {}}
              />
            </div>

            {/* Sign reading dialog */}
            <SignReadingDialog
              open={signDialogOpen}
              onOpenChange={setSignDialogOpen}
              siteId={activeItem.site.id}
              timepoint={activeItem.assessment.timepoint}
              projectType={projectType}
              modelGrade={activeItem.assessment.grade}
              onSigned={() => {
                advanceQueue();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
