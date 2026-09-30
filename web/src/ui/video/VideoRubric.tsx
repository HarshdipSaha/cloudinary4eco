"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Copy, Megaphone } from "lucide-react";
import type { CampaignSentence, EvidenceStatus, FlagKind } from "@/domain/types";
import { formatTimestamp } from "@/domain/timecode";
import { activeObservation, markerPercent } from "@/ui/video/timeline";
import { ProbabilityBar } from "@/ui/ProbabilityBar";
import { FlagMark, StatusMark } from "@/ui/marks";
import { Button } from "@/ui/Button";

export interface RubricObservation {
  assetId: string;
  second: number;
  thumbUrl: string;
  status: string;
  statusReason: string | null;
  relevance: string | null;
  activity: string | null;
  flags: { kind: string; detail: string }[];
  decisions: {
    kind: string;
    answer: string | null;
    confidence: number | null;
    probabilities: Record<string, number> | null;
    model: string | null;
    status: string;
    reason: string | null;
  }[];
}

export function VideoRubric(props: {
  importId: string;
  status: string;
  siteName: string;
  sourceUrl: string;
  permissionNote: string;
  videoUrl: string;
  posterUrl?: string;
  durationSeconds: number;
  observations: RubricObservation[];
  campaign: { imageUrl: string; sentences: CampaignSentence[]; createdAt: string } | null;
}) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(props.durationSeconds);
  const [playable, setPlayable] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = activeObservation(props.observations, currentTime);
  const canCampaign =
    props.status === "complete" && props.observations.some((o) => o.status === "accepted" && o.relevance === "evidence");
  const caption = useMemo(
    () => (props.campaign?.sentences ?? []).filter((s) => s.status === "kept").map((s) => s.text).join(" "),
    [props.campaign]
  );

  function seek(o: RubricObservation) {
    setCurrentTime(o.second);
    const v = video.current;
    if (!v || !playable) return;
    v.pause();
    v.currentTime = o.second;
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/public-video/${encodeURIComponent(props.importId)}/campaign`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Campaign generation failed");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface-0">
      <header className="border-b border-line bg-surface-1 px-8 py-5">
        <div className="mono flex items-center gap-2 text-[12px] uppercase tracking-wider text-text-3">
          <Clapperboard className="h-4 w-4 text-measure" /> Video rubric · {props.siteName}
        </div>
        <a href={props.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-[13px] text-measure underline underline-offset-2">
          {props.sourceUrl}
        </a>
        <p className="mt-1 text-[12px] text-text-3">
          Permission: {props.permissionNote} · Frames sampled at fixed points; capture time and GPS are not verified.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 p-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="space-y-3">
          {playable ? (
            <video
              ref={video}
              src={props.videoUrl}
              poster={props.posterUrl}
              controls
              preload="metadata"
              className="w-full rounded-[2px] border border-line bg-black"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
              onError={() => setPlayable(false)}
            />
          ) : (
            <div className="rounded-[2px] border border-line bg-surface-1 p-6 text-[13px] text-text-2">
              Video playback is unavailable. The sampled frames below remain inspectable.
            </div>
          )}

          {/* Marker strip: true positions of sampled frames on the video's timeline */}
          <div className="relative h-8 rounded-[2px] border border-line bg-surface-1" role="group" aria-label="Sampled frame positions">
            <div className="absolute inset-y-0 left-0 bg-measure/15" style={{ width: `${markerPercent(currentTime, duration)}%` }} />
            {props.observations.map((o) => (
              <button
                key={o.assetId}
                onClick={() => seek(o)}
                aria-label={`Seek to ${formatTimestamp(o.second)}: ${o.relevance ? o.relevance.replaceAll("_", " ") : "undecided"}`}
                aria-current={active?.assetId === o.assetId}
                className={`absolute top-1 bottom-1 w-2 -translate-x-1/2 rounded-[1px] ${
                  active?.assetId === o.assetId ? "bg-measure" : o.relevance === "evidence" ? "bg-text-2" : "bg-flag"
                }`}
                style={{ left: `${markerPercent(o.second, duration)}%` }}
              />
            ))}
          </div>
          <div className="mono text-[11px] text-text-3">
            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
          </div>
        </section>

        <section className="space-y-3" aria-label="Time-linked observations">
          <h2 className="mono text-[11px] font-semibold uppercase tracking-wider text-text-3">Observations</h2>
          {props.observations.map((o) => {
            const relevance = o.decisions.find((d) => d.kind === "triage_relevance");
            const isActive = active?.assetId === o.assetId;
            return (
              <button
                key={o.assetId}
                onClick={() => seek(o)}
                aria-current={isActive}
                className={`flex w-full gap-3 rounded-[2px] border bg-surface-1 p-3 text-left text-[12px] ${
                  isActive ? "border-measure" : "border-line hover:border-text-3"
                }`}
              >
                <img src={o.thumbUrl} alt={`Frame at ${formatTimestamp(o.second)}`} className="h-20 w-20 shrink-0 rounded-[2px] object-cover" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono font-medium text-text">{formatTimestamp(o.second)}</span>
                    <StatusMark status={o.status as EvidenceStatus} reason={o.statusReason} />
                  </div>
                  <div className="text-text-2">
                    {o.relevance ? o.relevance.replaceAll("_", " ") : "No relevance decision"}
                    {o.activity ? ` · ${o.activity.replaceAll("_", " ")}` : ""}
                  </div>
                  {relevance?.probabilities && relevance.answer && (
                    <ProbabilityBar probabilities={relevance.probabilities} chosen={relevance.answer} />
                  )}
                  {relevance?.status === "pending" && <div className="text-[11px] text-text-3">{relevance.reason}</div>}
                  {o.flags.map((f, i) => (
                    <FlagMark key={i} kind={f.kind as FlagKind} detail={f.detail} />
                  ))}
                </div>
              </button>
            );
          })}
        </section>
      </div>

      <section className="mx-8 mb-8 space-y-4 rounded-[2px] border border-line bg-surface-1 p-6" aria-label="Campaign output">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="mono flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-3">
            <Megaphone className="h-4 w-4 text-measure" /> Campaign card
          </div>
          <Button variant="primary" onClick={generate} disabled={!canCampaign || generating}>
            {generating ? "Generating…" : props.campaign ? "Regenerate" : "Generate campaign card"}
          </Button>
        </div>
        {!canCampaign && (
          <p className="text-[12px] text-text-3">
            Accept at least one frame classified as field evidence in Review. Campaign cards use only human-accepted evidence.
          </p>
        )}
        {error && <p className="text-[12px] text-flag">{error}</p>}
        {props.campaign && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <img src={props.campaign.imageUrl} alt="Campaign card built from accepted video frames" className="w-full rounded-[2px] border border-line" />
            <div className="space-y-3 text-[13px]">
              <ol className="space-y-2">
                {props.campaign.sentences.map((s, i) => (
                  <li key={i} className={s.status === "kept" ? "text-text" : "text-text-3"}>
                    <span className={s.status === "struck" ? "line-through" : ""}>{s.text}</span>
                    <span className="mono ml-2 text-[11px] text-text-3">[{s.factIds.join("][")}]</span>
                    {s.reason && <div className="text-[11px] text-text-3">{s.reason}</div>}
                  </li>
                ))}
              </ol>
              <Button variant="quiet" onClick={() => navigator.clipboard.writeText(caption)} disabled={!caption} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Copy checked caption
              </Button>
              <p className="mono text-[11px] text-text-3">Generated {new Date(props.campaign.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
