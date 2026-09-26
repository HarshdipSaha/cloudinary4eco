# Requirements Delta — Distilled local fallback model for Jev decisions

## Status
Deferred. Do not build until: (a) the hackathon has ended, and (b) hackathon data providers
give us an expanded/real dataset to train against. See `effort-state.md`.

## Context
`web/src/ports/decisions.ts` defines `DecisionsPort`, currently implemented by
`web/src/adapters/jev/client.ts` (Jev/TypeSafe). Every typed judgement in the pipeline —
triage (site match, relevance, activity), SRC grading, witness agreement, sentence support,
search relevance — goes through this port, and each `Decision` carries calibrated
`probabilities`/`confidence` used to route low-confidence cases to a human reviewer
(`THRESHOLDS`) and to decide which report sentences survive fact-checking
(`sentenceKeep`).

A Together AI blog post ("How to train your own Jev for $17") describes fine-tuning a small
open model (Qwen3.5 4B) via LoRA on ~38k generic classification examples (MultiNLI, BoolQ,
Banking77, AG News, SST-5, policy/routing datasets) to produce a cheap classifier that answers
single multiple-choice questions with a bare letter.

## NEW requirement
Add a second `DecisionsPort` implementation — a distilled local/open model — usable as:
1. A **fallback** when Jev is unavailable (`DecisionsUnavailable`), where the pipeline
   currently just shows "pending".
2. A **shadow model**, logged alongside real Jev decisions in the ledger for comparison, not
   yet gating any real decision.

This is additive: it must not replace or change behavior of the existing Jev adapter, and
must not touch `DecisionsPort`'s contract.

## Why NOT to build it with the recipe as-is (rated 3/10 to do now)
- **Calibration gap.** The blog's model returns a single top token (`max_tokens=8`, one
  letter) with no calibrated probability/confidence. Our thresholds
  (`web/src/domain/thresholds.ts`) depend on real probabilities, not just an argmax label.
  Naive logprob-based confidence from a 25-minute LoRA fine-tune will likely be poorly
  calibrated without a held-out calibration pass (temperature scaling / Platt scaling).
- **Answer-shape mismatch.** Our adapter batches multiple keyed questions per call and mixes
  three answer types (`choice`, `score`, `noul`/boolean-with-probability). The Tev-style
  recipe handles one multiple-choice question per call. Batching and score/noul support would
  need to be built from scratch.
- **Domain mismatch.** The recipe's training sets (MultiNLI, BoolQ, Banking77, AG News, SST-5,
  generic policy/routing) don't resemble our actual decisions (SRC grading from CV change
  metrics + Cloudinary tags, witness photo agreement, sentence-to-fact support). SRC grading —
  our most important decision — would likely get *worse*, not better, trained on that mix.
- **Narrative risk.** README/demo script present Jev as the calibrated decision layer end to
  end. A same-hackathon in-house replacement undercuts that story before judging.

## Why it's worth doing LATER (rated 6/10 as a fallback/shadow adapter)
- Hardware is sufficient without paying for Together's managed fine-tuning: a LoRA (or even
  full fine-tune) of a ~4B model trains comfortably on an A100 40GB; Kaggle GPU is fine for
  eval/inference.
- We can train on our **own ledger data** (real Jev decisions: state, question, answer,
  probabilities) instead of generic public datasets — much closer to our actual distribution.
- `DecisionsPort` already isolates the pipeline from the concrete adapter, so this is a clean
  additive change (new adapter + wiring in `web/src/adapters/container.ts`), not a rewrite.

## Plan (once unblocked)
1. Export historical Jev decisions from the ledger (state/question/answer/probabilities) as
   training data, plus whatever expanded dataset the hackathon providers give us.
2. LoRA fine-tune Qwen3.5-4B (or similar) on that data on the A100 40GB.
3. Derive probabilities from logprobs over the option set; calibrate on a held-out split
   (temperature/Platt scaling); measure ECE and agreement rate against real Jev.
4. Implement `DecisionsPort` for the distilled model; wire it as fallback-on-unavailable and/or
   shadow-only (write-only to ledger for comparison), gated behind a feature flag / env var.
5. Only consider promoting it toward the primary path if calibration and agreement metrics are
   close to Jev's — this needs an explicit approval gate, not a silent swap.

## Open questions (resolve before planning stage)
- What exactly will "more data from hackathon providers" contain — labeled examples, more raw
  site imagery, or something else? Shapes whether step 1 above is even feasible as scoped.
- Licensing/ToS on any hackathon-provided data for training a model we might use in production.
- Where the calibration/shadow-comparison metrics get surfaced (Trust page? a new internal
  report?).
