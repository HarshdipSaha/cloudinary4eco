# Jev evaluation corpus

`cases.jsonl` holds <!-- claim:calibration.cases -->228<!-- /claim --> labelled cases: <!-- claim:calibration.relevance_cases -->120<!-- /claim --> evidence-relevance, <!-- claim:calibration.site_cases -->60<!-- /claim --> site-identification, and <!-- claim:calibration.grade_cases -->48<!-- /claim --> SRC-grade cases. `npm run calibrate` sends every case to live Jev and writes `results.json` (metrics) and `predictions.jsonl` (every answer). Nothing in those files is hand-entered.

## Latest live result

Metrics are computed on the held-out test half only. Intervals are 95% Wilson intervals and are wide, because the test sets are small.

| Decision | Test cases | Top-answer accuracy |
|---|---|---|
| Evidence relevance | <!-- claim:calibration.relevance_test_n -->59<!-- /claim --> | <!-- claim:calibration.relevance_accuracy -->100.0%<!-- /claim --> |
| Site identification | <!-- claim:calibration.site_test_n -->31<!-- /claim --> | <!-- claim:calibration.site_accuracy -->83.9%<!-- /claim --> |
| SRC grade | <!-- claim:calibration.grade_test_n -->17<!-- /claim --> | <!-- claim:calibration.grade_accuracy -->88.2%<!-- /claim --> |

Brier score, ECE, reliability bins, the accept threshold and its coverage are in `results.json` and on the Trust page.

## What this does and does not show

- **Jev reads text, not pixels.** Each case is the text card the pipeline sends (caption, tags, OCR, comment, filename, candidate sites, measured metrics). This evaluates Jev's reading of that text.
- **Every case is an authored scenario, not a field photo.** They were written from the rubric text by the project's developers with an AI coding assistant, not by independent labellers, so label and author share assumptions. The relevance result in particular reflects clear-cut descriptions; it is not an estimate of accuracy on real submissions. Real photos labelled by a person can be added (`origin: "ledger"`, see below).
- **What the misses show.** Jev often answers `none` when there is no GPS and the text names a feature of one plot, and it graded a lighting-only change as the worst grade at 92% confidence even though the prompt says brightness alone is not progress. Both appear in the Trust page's list of held-out errors.

## Rules

1. Labels come from the rubric text in `web/src/adapters/jev/questions.ts` and `web/src/domain/src-rubrics.ts`, decided before any Jev run. `note` gives the reason in one sentence.
2. A label is never changed after seeing Jev's answer unless it contradicts the rubric. Any change to a case after the first live run is recorded in `LABEL_CHANGES.md`.
3. Case ids are split into tune and test halves by a hash of the id, so a case never moves between them. The accept threshold is chosen on tune; every reported metric is computed on test.
4. Inputs must be ones the pipeline can produce. For example, sites farther than 5000 m are never candidates, and a photo with no usable GPS lists every site with an unknown distance.

## Coverage minimums (enforced by `web/src/test/calibration-cases.test.ts`)

| Kind | Minimum |
|---|---|
| Relevance | 30 per class, 12 per project type, and at least 8 of each class in the test half |
| Site | 60, of which at least 15 are `none` |
| Grade | 12 per level (0–3) |

## Adding real photos

`npm run calibration:export -- <projectId>` writes real ledger cards to `calibration/ledger-candidates.jsonl` with an empty label. A person labels each from the rubric, writes a note, and moves the rows into `cases.jsonl` with `origin: "ledger"`; then rerun `npm run calibrate`. CI fails if `results.json` does not match `cases.jsonl`.
