import { notFound } from "next/navigation";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { cld } from "@/ui/cld";
import { VideoRubric, type RubricObservation } from "@/ui/video/VideoRubric";

export const dynamic = "force-dynamic";

export default async function VideoRubricPage(props: { params: Promise<{ importId: string }> }) {
  const { importId } = await props.params;
  const rubric = await repo.videoRubric(await getDb(), importId);
  if (!rubric) notFound();

  const observations: RubricObservation[] = rubric.observations.map(({ frame, decisions }) => ({
    assetId: frame.assetId,
    second: frame.frameSecond ?? 0,
    thumbUrl: cld.thumb(frame.assetId, 160),
    status: frame.status,
    statusReason: frame.statusReason,
    relevance: frame.relevance,
    activity: frame.activity,
    flags: frame.flags.map((f) => ({ kind: f.kind, detail: f.detail })),
    decisions: decisions.map((d) => ({
      kind: d.kind,
      answer: d.answer === null || d.answer === undefined ? null : String(d.answer),
      confidence: d.confidence,
      probabilities: d.probabilities,
      model: d.model,
      status: d.status,
      reason: d.reason,
    })),
  }));

  return (
    <VideoRubric
      importId={rubric.import.id}
      status={rubric.import.status}
      siteName={rubric.site?.name ?? rubric.import.siteId}
      sourceUrl={rubric.import.sourceUrl}
      permissionNote={rubric.import.permissionNote}
      videoUrl={cld.video(rubric.import.remoteVideoAssetId)}
      posterUrl={observations[0] ? cld.plate(observations[0].assetId, 1280) : undefined}
      durationSeconds={rubric.import.durationSeconds}
      observations={observations}
      campaign={
        rubric.campaign && {
          imageUrl: rubric.campaign.imageUrl,
          sentences: rubric.campaign.sentences,
          createdAt: rubric.campaign.createdAt.toISOString(),
        }
      }
    />
  );
}
