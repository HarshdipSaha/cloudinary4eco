# Effort 001 — Characterization: baseline picker never shows candidates

## Symptom (observed live, 2026-09-25)
Uploaded `baseline.jpg` via Intake → assigned it to site `plot-b` via the review drawer
(`assign_site`, confirmed persisted: evidence row shows `siteId: plot-b`). Navigated to
`/sites/plot-b`. Page correctly detects `site.baselineAssetId` is null and shows "This site
does not have a designated baseline photo yet. Select a photo below to set it as baseline:" —
but the grid below is **always empty**, for every photo assigned to the site, with no
candidates and no explanatory empty state. There is no way to ever set a baseline through this
UI once a site has zero baseline.

## Root cause (traced, not guessed)
`ui/site/ReadingPanel.tsx` (no-baseline branch, ~line 82) sources the candidate grid from
`activeTP?.photos`, where `activeTP = timepoints.find(...) ?? timepoints.at(-1)`.

`timepoints` is a prop built by `ledger/repo.ts#siteChart` **exclusively from
`assessmentsForSite`** — i.e. only calendar days that already have a grading `assessment` row.

An assessment row is only ever inserted by `pipeline/assess.ts#assessSite`, which returns
`null` immediately `if (!site?.baselineAssetId)` (line 11) — grading a follow-up against a
baseline that doesn't exist is correctly refused.

Consequence: **before a site has a baseline, `timepoints` is provably always `[]`**, for every
photo, regardless of whether that photo has a known capture date. The picker's data source
(`timepoints`) and its precondition (`!baseline`) are mutually exclusive by construction — this
branch of the UI can never render a candidate. It is not merely the missing-EXIF-date edge case
I first suspected while testing (that compounds the problem for date-less uploads once a
baseline *does* exist, in a different code path — see "secondary finding" below), it is a
100%-reproducible dead end for every site's very first baseline assignment.

## Secondary finding (real, lower severity, same root class)
Independently: `pipeline/ingest.ts#evidenceRow` only sets `timepoint` when
`a.capturedAt` is resolved (EXIF or WhatsApp chat fallback). Even *after* a baseline exists,
a follow-up photo with no resolvable capture date can never be graded (no `day` → `touched`
map in `ingestBatch` never gets this site/day → `assessSite` never runs for it) and so never
appears in the *existing-timepoints* timeline either. This is a real gap for genuinely
date-less evidence, but out of scope to fully solve here (it would require deciding a product
policy for "assign a synthetic/manual timepoint to date-less evidence", which the requirements
baseline doesn't specify). This effort only fixes the baseline-picker candidate source, which is
the concrete, reproducible bug requested.

## Fix approach
Source the baseline-candidate grid from `evidenceForSite` (already fetched into `siteChart`'s
`items`, but currently discarded except for status counts and the `timepoints` filter) instead
of from `timepoints`. Candidates: all evidence rows for this site with `status !== "set_aside"`.
Pass this list down as a new `candidates` prop on `ReadingPanel` so the component doesn't need
to reconstruct it from `timepoints`. Add an explicit empty state ("No photos assigned to this
site yet — go to Intake or Review to assign one") for the genuine zero-evidence case, so an
empty grid is never silently indistinguishable from "still loading" or "bug".

## Why not touch `assess.ts` / grading gate
The `!site?.baselineAssetId → return null` guard in `assessSite` is correct per requirements
("Measure, then decide" — you cannot register/grade against a baseline that doesn't exist).
Changing it would be a requirements change (what does "grade" mean with no baseline?), not a
bug fix — out of scope per the AI-DLC fix fast-path rule ("if it turns out to be a requirements
gap, stop and revise the baseline instead"). This is not a requirements gap: the baseline
picker is supposed to work *before* grading is possible, so its data source is simply wrong.
