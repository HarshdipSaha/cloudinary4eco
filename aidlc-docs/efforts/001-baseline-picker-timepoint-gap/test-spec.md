# Effort 001 — Test Specification

## New unit test: `src/test/site-chart.test.ts`
Add a second `it(...)` in the existing `describe("siteChart", ...)` block, using site `s2`
("Plot C") from `world()`, which starts with `baselineAssetId: null` and no evidence — exactly
the pre-baseline state that reproduces the bug.

**Test: "returns baseline candidates for a site with no baseline yet, even with no graded timepoints"**
1. `ingestBatch` two assets assigned to `s2` via `siteId: "s2"` (bypasses Jev site-triage,
   mirroring how `assign_site` review actions call `ingestBatch`) — one with a resolvable
   `capturedAt`, one without (`analysis("nc1")` with no `capturedAt` override, matching the real
   date-less-upload case from manual testing).
2. Call `repo.siteChart(w.db, "s2")`.
3. Assert `c.timepoints` is `[]` (proves the precondition: no graded timepoints exist — this is
   the state that currently starves the UI).
4. Assert `c.candidates` (new field) contains **both** asset IDs, regardless of `capturedAt`
   presence — this is the behavior that must exist for the picker to ever work.
5. Assert a `set_aside` evidence row for the same site is **excluded** from `candidates` (a
   rejected photo should never be offered as a baseline).

This test must fail against the current `repo.siteChart` (no `candidates` field, or empty) before
the fix, and pass after `evidenceForSite`-derived candidates are added.

## Existing test to re-run unmodified (regression guard)
`site-chart.test.ts`'s existing test (site `s1`, has a baseline) must still pass unchanged —
confirms the fix doesn't disturb the already-working graded-timeline path.

## Out of scope for this test spec
- The "secondary finding" (date-less evidence never graded even after a baseline exists) is not
  covered by a new test — no code changes are being made for it in this effort (see
  characterization.md, "why not touch assess.ts").
- No Playwright/browser test added for this effort; the existing manual e2e pass (Effort 002)
  will re-verify the fix live in the browser as part of the broader dataset testing pass.

## Approval gate
Pausing here before writing any implementation code, per the AI-DLC fix fast-path.
