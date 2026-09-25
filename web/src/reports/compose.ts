import { nanoid, customAlphabet } from "nanoid";
import * as repo from "@/ledger/repo";
import type { DrafterPort } from "@/ports/drafter";
import { DecisionsUnavailable } from "@/ports/decisions";
import type { PipelineDeps } from "@/pipeline/ingest";
import { buildDigest } from "./digest";
import { splitDraft } from "./sentences";

const slug = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 10);

export async function composeReport(
  deps: PipelineDeps & { drafter: DrafterPort },
  p: { projectId: string; periodStart: string; periodEnd: string }
) {
  const { db, decisions, drafter } = deps;
  const project = await repo.project(db, p.projectId);
  if (!project) throw new Error(`Unknown project ${p.projectId}`);
  const facts = await buildDigest(db, p.projectId, p.periodStart, p.periodEnd);
  const byId = new Map(facts.map((f) => [f.id, f]));
  const draft = await drafter.draft({ projectName: project.name, periodStart: p.periodStart, periodEnd: p.periodEnd, facts });
  const sentences = splitDraft(draft);
  const id = nanoid(12);
  await repo.insertReport(db, {
    id,
    projectId: p.projectId,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    publicSlug: slug(),
    draft,
    facts,
  });

  const checkable = sentences.map((s, i) => ({ s, i })).filter(({ s }) => s.factIds.length && s.factIds.every((f) => byId.has(f)));
  const verdicts: Map<number, { keep: boolean; support: number; decisionId: number } | { pending: true; decisionId: number }> =
    new Map();
  try {
    const ds = await decisions.sentenceSupport(
      checkable.map(({ s, i }) => ({ id: `${id}#${i}`, sentence: s.text, facts: s.factIds.map((f) => byId.get(f)!.text) }))
    );
    for (let k = 0; k < ds.length; k++) {
      const d = ds[k]!;
      verdicts.set(checkable[k]!.i, {
        keep: d.answer,
        support: d.probabilities.yes ?? d.confidence,
        decisionId: await repo.recordDecision(db, d),
      });
    }
  } catch (e) {
    if (!(e instanceof DecisionsUnavailable)) throw e;
    for (const { i } of checkable) {
      verdicts.set(i, { pending: true, decisionId: await repo.recordPending(db, "sentence_support", `${id}#${i}`, e.message) });
    }
  }

  await repo.insertSentences(
    db,
    sentences.map((s, i) => {
      const base = { reportId: id, section: s.section, ordinal: i, text: s.text, factIds: s.factIds };
      if (!s.factIds.length) return { ...base, status: "struck", reason: "No receipt: the sentence cites no facts" };
      if (!s.factIds.every((f) => byId.has(f))) return { ...base, status: "struck", reason: "Cites a fact that does not exist" };
      const v = verdicts.get(i)!;
      if ("pending" in v) return { ...base, status: "pending", decisionId: v.decisionId, reason: "Check pending: Jev unavailable" };
      return {
        ...base,
        status: v.keep ? "kept" : "struck",
        support: v.support,
        decisionId: v.decisionId,
        reason: v.keep ? null : `Not supported by the cited facts (support ${Math.round(v.support * 100)}%)`,
      };
    })
  );
  return id;
}
