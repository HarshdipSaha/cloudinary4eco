import { nanoid } from "nanoid";
import * as repo from "@/ledger/repo";
import { urls } from "@/adapters/cloudinary/urls";
import { formatTimestamp } from "@/domain/timecode";
import type { CampaignSentence } from "@/domain/types";
import { DecisionsUnavailable } from "@/ports/decisions";
import type { Fact } from "@/ports/drafter";
import type { PipelineDeps } from "@/pipeline/ingest";

export interface CampaignFrame {
  assetId: string;
  frameSecond: number | null;
  status: string;
  relevance: string | null;
  activity: string | null;
}

const MAX_CARD_FRAMES = 3;
const words = (s: string) => s.replaceAll("_", " ");
const at = (f: CampaignFrame) => formatTimestamp(f.frameSecond ?? 0);
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

/** A campaign may only show frames a human accepted and Jev classed as field evidence. */
export const isUsableFrame = (f: CampaignFrame) => f.status === "accepted" && f.relevance === "evidence";

export function videoFacts(input: { siteName: string; durationSeconds: number; frames: CampaignFrame[] }): Fact[] {
  const all = input.frames.map((f) => f.assetId);
  const facts: Omit<Fact, "id">[] = [
    {
      text: `A permitted public video of ${input.siteName}, ${Math.round(input.durationSeconds)} seconds long, was sampled at ${input.frames.length} fixed points.`,
      evidenceIds: all,
    },
    ...input.frames.map((f) => {
      const what =
        f.relevance === "evidence"
          ? `was classified as field evidence showing ${words(f.activity ?? "unclassified activity")}`
          : f.relevance
            ? `was classified as ${words(f.relevance)}, not field evidence`
            : "has no relevance decision yet";
      return { text: `The frame at ${at(f)} ${what}; its review status is ${words(f.status)}.`, evidenceIds: [f.assetId] };
    }),
    { text: "Capture time and GPS location of the video are not verified.", evidenceIds: all },
  ];
  return facts.map((f, i) => ({ id: `F${i + 1}`, ...f }));
}

/** Facts are laid out as [sampling, ...one per frame, verification gap]. */
export function campaignDraft(facts: Fact[], frames: CampaignFrame[], siteName: string) {
  const frameFact = (i: number) => facts[i + 1]!.id;
  const usable = frames.map((f, i) => ({ f, i })).filter(({ f }) => isUsableFrame(f));
  const activities = [...new Set(usable.map(({ f }) => words(f.activity ?? "field work")))];
  return [
    {
      text: `Footage from ${siteName} shows ${list(activities)} at ${list(usable.map(({ f }) => at(f)))}.`,
      factIds: usable.map(({ i }) => frameFact(i)),
    },
    {
      text: `${usable.length} of ${frames.length} sampled frames were accepted as field evidence.`,
      factIds: [facts[0]!.id, ...frames.map((_, i) => frameFact(i))],
    },
    { text: "The video's date and location are not independently verified.", factIds: [facts.at(-1)!.id] },
  ];
}

export async function composeVideoCampaign(deps: Pick<PipelineDeps, "db" | "decisions">, importId: string) {
  const { db, decisions } = deps;
  const rubric = await repo.videoRubric(db, importId);
  if (!rubric) throw new Error("Public video import not found.");
  if (rubric.import.status !== "complete") throw new Error("The video import has not finished.");

  const frames: CampaignFrame[] = rubric.observations.map(({ frame }) => frame);
  const usable = frames.filter(isUsableFrame);
  if (!usable.length) throw new Error("Accept at least one frame as field evidence before generating a campaign card.");

  const siteName = rubric.site?.name ?? "the site";
  const facts = videoFacts({ siteName, durationSeconds: rubric.import.durationSeconds, frames });
  const byId = new Map(facts.map((f) => [f.id, f]));
  const draft = campaignDraft(facts, frames, siteName);
  const id = `vc_${nanoid(12)}`;

  const sentences: CampaignSentence[] = [];
  try {
    const verdicts = await decisions.sentenceSupport(
      draft.map((s, i) => ({ id: `${id}#${i}`, sentence: s.text, facts: s.factIds.map((f) => byId.get(f)!.text) }))
    );
    for (const [i, d] of verdicts.entries()) {
      const support = d.probabilities.yes ?? d.confidence;
      sentences.push({
        ...draft[i]!,
        status: d.answer ? "kept" : "struck",
        support,
        decisionId: await repo.recordDecision(db, d),
        reason: d.answer ? null : `Not supported by the cited facts (support ${Math.round(support * 100)}%)`,
      });
    }
  } catch (e) {
    if (!(e instanceof DecisionsUnavailable)) throw e;
    sentences.length = 0;
    for (const [i, s] of draft.entries()) {
      sentences.push({
        ...s,
        status: "pending",
        support: null,
        decisionId: await repo.recordPending(db, "sentence_support", `${id}#${i}`, e.message),
        reason: "Check pending: Jev unavailable",
      });
    }
  }

  const cardFrames = usable.slice(0, MAX_CARD_FRAMES);
  await repo.insertVideoCampaign(db, {
    id,
    importId,
    frameAssetIds: cardFrames.map((f) => f.assetId),
    imageUrl: urls().campaignCard({
      frames: cardFrames.map((f) => ({ assetId: f.assetId, label: at(f) })),
      footer: `Public video · ${siteName} · date and GPS unverified`,
    }),
    facts,
    sentences,
  });
  return id;
}
