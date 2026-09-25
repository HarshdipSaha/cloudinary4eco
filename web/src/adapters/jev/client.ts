import { TypeSafeClient, APIConnectionError, APITimeoutError, RateLimitError, APIError, type Fetch } from "@typesafe-ai/sdk";
import type { Decision, DecisionKind, Relevance, WitnessAgreement } from "@/domain/types";
import { THRESHOLDS } from "@/domain/thresholds";
import { DecisionsUnavailable, type DecisionsPort, type TriageResult } from "@/ports/decisions";
import { agreementQuestion, gradeQuestion, searchQuestions, sentenceQuestions, triageQuestions } from "./questions";

type Answer =
  | { type: "choice"; choice: string; confidence: number; probabilities: Record<string, number> }
  | { type: "score"; score: number; confidence: number; probabilities: Record<string, number> }
  | { type: "noul"; noul: number };

export interface JevConfig { apiKey?: string; model?: string; fetch?: Fetch; timeoutMs?: number; maxRetries?: number }

export function jevDecisions(cfg: JevConfig = {}): DecisionsPort {
  const client = new TypeSafeClient({
    apiKey: cfg.apiKey ?? process.env.TYPESAFE_API_KEY ?? process.env.JEV_API_KEY,
    defaultModel: cfg.model ?? process.env.TYPESAFE_DEFAULT_MODEL ?? "jev-latest",
    timeout: cfg.timeoutMs ?? 8000,
    retry: { maxRetries: cfg.maxRetries ?? 2 },
    ...(cfg.fetch ? { fetch: cfg.fetch } : {}),
  });

  async function ask(state: unknown, questions: Record<string, unknown>, shareAcross = 1) {
    const started = performance.now();
    try {
      const res = await client.systemOne({ state: state as any, questions: questions as any });
      return {
        answers: res.answers as unknown as Record<string, Answer>,
        questions,
        state,
        model: res.model,
        latencyMs: Math.round(performance.now() - started),
        tokensEach: Math.round(res.usage.input_tokens / shareAcross),
      };
    } catch (e) {
      if (e instanceof APIConnectionError || e instanceof APITimeoutError || e instanceof RateLimitError || (e instanceof APIError && (e as any).status >= 500)) {
        throw new DecisionsUnavailable(`Jev unavailable: ${(e as Error).message}`);
      }
      throw e;
    }
  }

  type Meta = { model: string; latencyMs: number; tokensEach: number; questions: Record<string, unknown>; state: unknown };
  function toDecision<T>(kind: DecisionKind, subjectId: string, a: Answer | undefined, meta: Meta, map: (a: Answer) => T, key?: string): Decision<T> {
    if (!a) throw new Error(`Jev returned no answer for ${kind}/${subjectId}`);
    const probabilities = a.type === "noul" ? { yes: a.noul, no: 1 - a.noul } : a.probabilities;
    const confidence = a.type === "noul" ? Math.max(a.noul, 1 - a.noul) : a.confidence;
    return {
      kind, subjectId, question: key ? meta.questions[key] : meta.questions, state: meta.state,
      answer: map(a), probabilities, confidence, model: meta.model, latencyMs: meta.latencyMs, inputTokens: meta.tokensEach,
    };
  }
  const choiceOf = (a: Answer) => (a.type === "choice" ? a.choice : String(a));
  const topLevel = (a: Answer) => {
    if (a.type !== "score") return NaN;
    return Number(Object.entries(a.probabilities).sort((x, y) => y[1] - x[1])[0]![0]);
  };
  const noulOf = (a: Answer) => (a.type === "noul" ? a.noul : NaN);

  return {
    async triage(inputs) {
      const out: TriageResult[] = [];
      for (let i = 0; i < inputs.length; i += THRESHOLDS.triageBatchSize) {
        const batch = inputs.slice(i, i + THRESHOLDS.triageBatchSize);
        const { state, questions } = triageQuestions(batch);
        const meta = await ask(state, questions, batch.length);
        batch.forEach((t, j) => {
          out.push({
            assetId: t.assetId,
            site: t.candidateSites.length ? toDecision("triage_site", t.assetId, meta.answers[`a${j}_site`], meta, choiceOf, `a${j}_site`) : null,
            relevance: toDecision("triage_relevance", t.assetId, meta.answers[`a${j}_relevance`], meta, (a) => choiceOf(a) as Relevance, `a${j}_relevance`),
            activity: toDecision("triage_activity", t.assetId, meta.answers[`a${j}_activity`], meta, choiceOf, `a${j}_activity`),
          });
        });
      }
      return out;
    },

    async gradeSite(g) {
      const { state, questions } = gradeQuestion(g);
      const meta = await ask(state, questions);
      return toDecision("src_grade", `${g.siteId}@${g.timepoint}`, meta.answers.grade, meta, topLevel, "grade");
    },

    async witnessAgreement(a) {
      const { state, questions } = agreementQuestion(a);
      const meta = await ask(state, questions);
      return toDecision("witness_agreement", a.siteId, meta.answers.agreement, meta, (x) => choiceOf(x) as WitnessAgreement, "agreement");
    },

    async sentenceSupport(items) {
      if (!items.length) return [];
      const { state, questions } = sentenceQuestions(items);
      const meta = await ask(state, questions, items.length);
      return items.map((it, i) => toDecision("sentence_support", it.id, meta.answers[`s${i}`], meta, (a) => noulOf(a) >= THRESHOLDS.sentenceKeep, `s${i}`));
    },

    async searchRelevance(query, cards) {
      if (!cards.length) return [];
      const { state, questions } = searchQuestions(query, cards);
      const meta = await ask(state, questions, cards.length);
      return cards.map((c, i) => toDecision("search_relevance", c.id, meta.answers[`r${i}`], meta, noulOf, `r${i}`));
    },
  };
}
