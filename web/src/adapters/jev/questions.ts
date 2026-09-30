import { choice, noul, score } from "@typesafe-ai/sdk";
import type { ProjectType } from "@/domain/types";
import { SRC } from "@/domain/src-rubrics";
import type { AgreementInput, GradeInput, TriageInput } from "@/ports/decisions";

export const RELEVANCE_CRITERIA = {
  evidence: "Shows the physical project site, the work, or its result",
  people_only: "Mainly a portrait, selfie or group photo with little of the site",
  screenshot_or_meme: "A screenshot, forward, meme, poster or photo of a document",
  unusable_quality: "Too blurry, dark, obstructed or tiny to judge",
} as const;

export function triageQuestions(batch: TriageInput[]) {
  const state = {
    assets: batch.map((t) => ({
      caption: t.card.caption, tags: t.card.tags, ocr_text: t.card.ocrText, comment: t.card.comment,
      filename: t.card.filename, captured_at: t.card.capturedAt,
      candidate_sites: t.candidateSites.map((s) => ({ id: s.id, name: s.name, distance_m: s.distanceM === null ? null : Math.round(s.distanceM) })),
    })),
  };
  const questions: Record<string, ReturnType<typeof choice>> = {};
  batch.forEach((t, i) => {
    const ref = `\`assets[${i}]\``;
    if (t.candidateSites.length) {
      const criteria: Record<string, string> = Object.fromEntries(
        t.candidateSites.map((s) => [s.id, `${s.name}${s.description ? `: ${s.description}` : ""}${s.distanceM === null ? "" : ` (${Math.round(s.distanceM)} m from photo GPS)`}`]),
      );
      criteria.none = "None of these sites";
      questions[`a${i}_site`] = choice(`Which registered project site does ${ref} show? Use any available caption or OCR text, the comment, and GPS distance; text fields may be missing.`, criteria);
    }
    questions[`a${i}_relevance`] = choice(`Is ${ref} usable field evidence for a ${t.projectType.replace("_", " ")} project?`, RELEVANCE_CRITERIA);
    questions[`a${i}_activity`] = choice(`What activity is visible in ${ref}?`, SRC[t.projectType].activities);
  });
  return { state, questions };
}

export function gradeQuestion(g: GradeInput) {
  const rubric = SRC[g.projectType];
  return {
    state: {
      project_type: g.projectType,
      days_since_baseline: g.daysSinceBaseline,
      registration_quality: g.registrationQuality,
      baseline: { caption: g.baselineCaption },
      followup: { caption: g.followupCaption },
      measured_change: g.metrics && {
        vegetation_fraction_before: round(g.metrics.vegetationFractionBefore),
        vegetation_fraction_after: round(g.metrics.vegetationFractionAfter),
        vegetation_delta: round(g.metrics.vegetationDelta),
        changed_area_fraction: round(g.metrics.changedAreaFraction),
        brightness_shift: round(g.metrics.brightnessShift),
      },
    },
    questions: {
      grade: score(
        "Grade the change at this site from `baseline` to `followup` on the Site Response Criteria. The two photos are geometrically aligned views of the same place; `measured_change` was computed from pixels. Brightness shift alone is lighting, not progress.",
        [...rubric.levels] as [string, string, ...string[]],
      ),
    },
  };
}

export function agreementQuestion(a: AgreementInput) {
  return {
    state: { claim: a.claimText, implementer_evidence: a.implementerSummary, community_witness_evidence: a.witnessSummary },
    questions: {
      agreement: choice("Does `community_witness_evidence` corroborate or contradict the `claim`, given `implementer_evidence`?", {
        corroborates: "Witness photos show the same state of the site the claim describes",
        contradicts: "Witness photos show the site in a clearly different state than claimed",
        insufficient: "Witness evidence is too little or unclear to judge",
      }),
    },
  };
}

export function sentenceQuestions(items: { id: string; sentence: string; facts: string[] }[]) {
  const state = { items: items.map((x) => ({ sentence: x.sentence, cited_facts: x.facts })) };
  const questions = Object.fromEntries(
    items.map((_, i) => [`s${i}`, noul(`Is \`items[${i}].sentence\` fully supported by \`items[${i}].cited_facts\` alone, with no added numbers, places or claims?`)]),
  );
  return { state, questions };
}

export function searchQuestions(query: string, cards: { id: string; text: string }[]) {
  const state = { query, photos: cards.map((c) => c.text) };
  const questions = Object.fromEntries(cards.map((_, i) => [`r${i}`, noul(`Does \`photos[${i}]\` match the search \`query\`?`)]));
  return { state, questions };
}

const round = (n: number) => Math.round(n * 1000) / 1000;
export type { ProjectType };
