---
effort: 001
title: Baseline picker never shows candidates before a site has a baseline
type: bug fix (fix fast-path)
state: complete
---

## Timeline
1. characterization.md — traced root cause to `siteChart`'s `timepoints` (grading-gated) being
   the wrong data source for the pre-baseline candidate picker.
2. test-spec.md — approved via gate.
3. Test written first (`site-chart.test.ts`, second case), confirmed failing.
4. Fix: `repo.siteChart` now returns a `candidates` field (all non-set-aside evidence for the
   site) independent of graded timepoints; `ReadingPanel` sources the picker from it and shows
   an explicit empty state when a site truly has zero evidence yet.
5. Test passed. Full suite (27 files / 107 tests) green. Typecheck clean.
6. Verified live in browser: Plot C (zero evidence) shows the empty-state message; Plot B (one
   date-less photo assigned) shows exactly one candidate; clicking "Set as baseline" persists
   correctly (after Effort 002's fixes — see its effort-state for why this needed a second pass).

## Files touched
- `web/src/ledger/repo.ts` — `siteChart` gains `candidates`.
- `web/src/ui/site/ReadingPanel.tsx` — sources picker from `candidates`, adds empty state.
- `web/src/app/(console)/sites/[siteId]/page.tsx` — passes `candidates` through.
- `web/src/test/site-chart.test.ts` — new regression test.

## Incidental fix bundled in (not scope creep — found via `tsc --noEmit` while verifying)
- `web/src/search/search.ts` — `repo.t` doesn't exist (never re-exported); would fail
  `next build`'s type check. Changed to `Awaited<ReturnType<typeof repo.evidenceForProject>>`.
