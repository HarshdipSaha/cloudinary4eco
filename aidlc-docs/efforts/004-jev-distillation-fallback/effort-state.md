---
effort: 004
title: Distilled local fallback model for Jev decisions
type: feature (deferred)
state: blocked
---

## Why blocked
This is a post-hackathon idea, not active work. It is blocked on two external events:
1. The hackathon submission window closes.
2. Hackathon data providers give us more/real data to train against.

Do not start construction until both have happened. See `requirements-delta.md` for the
full rationale and open questions.

## Trigger to unblock
- [ ] Hackathon has ended
- [ ] Additional/expanded dataset from hackathon providers is available

Once both are checked, move state to `planning` and continue with normal effort planning
(functional design → NFRs → code → build & test).

## Tracking
GitHub issue: https://github.com/HarshdipSaha/cloudinary4eco/issues/1

## Origin
Raised during a chat rating a Together AI blog post ("How to train your own Jev for $17")
against our pipeline's use of Jev (TypeSafe) as the typed-decision layer
(`web/src/adapters/jev/client.ts`). Verdict at the time: 3/10 to do now (would weaken SRC
grading and calibration versus the real Jev), 6/10 as a future fallback/shadow adapter behind
the existing `DecisionsPort` interface, once trained on our own ledger data instead of generic
public datasets.
