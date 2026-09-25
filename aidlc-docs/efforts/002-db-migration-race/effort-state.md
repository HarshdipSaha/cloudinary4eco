---
effort: 002
title: PGlite migration race + cross-bundle singleton divergence
type: bug fix (fix fast-path)
state: complete
---

## Timeline
1. characterization.md — traced the original symptom (fresh PGlite dir 500s with
   `relation "projects" does not exist`) to unawaited migration in `getDb()`.
2. Gate: broad fix (async `getDb`/`deps`, ~27 call sites) approved by user.
3. Regression test written first (`db-cold-start.test.ts`), confirmed the mechanism.
4. Fix: `getDb`/`deps` made properly `async`; migration awaited before the handle is returned;
   in-flight construction memoized so concurrent cold-start callers share one promise.
5. Mechanical `await` added at all `getDb()` (13) and `deps()` (12) call sites, plus
   `scripts/seed.ts`. Typecheck and full suite green.
6. **Second bug found during live verification** (see addendum-globalthis.md): the module-scoped
   singleton wasn't actually process-wide across Next.js's page-vs-route-handler bundle split.
   Fixed by moving the cache onto `globalThis`.
7. Also fixed alongside (same session, same root class): started the CV worker (was simply never
   running — a normal FastAPI/uvicorn process, not a code bug) so `/api/status` reports it live
   instead of masking the effect of these DB bugs behind an unrelated "unreachable" banner.
8. Verified live end-to-end: real WhatsApp-export batch upload → triage → accept → baseline set →
   second photo reassigned → real CV registration against the live worker → real vegetation-change
   metrics → real Jev grade, all reflected correctly across page and API routes with no server
   restart between steps.

## Files touched
- `web/src/ledger/db.ts` — async `getDb`, awaited migration, in-flight memoization,
  `globalThis`-anchored singleton.
- `web/src/adapters/container.ts` — async `build`/`deps`.
- 13 page components + 12 API route handlers + `scripts/seed.ts` — `await getDb()` / `await deps()`.
- `web/src/test/db-cold-start.test.ts` — new regression test for the migration race.
- `cv/.env` (new, untracked/local) — `CLOUDINARY_URL` + `CV_WORKER_KEY` so the worker can start.

## Operational notes for future sessions (important — bit this session twice)
- **Never run `npm run seed` (or any other script that calls `getDb()`) while the dev server is
  also running.** PGlite is a single-process embedded database; a second process opening the
  same `.data/pglite` directory concurrently causes silent write loss or a fatal
  `RuntimeError: Aborted()`. Stop the dev server first, run the script, then restart.
- If a `RuntimeError: Aborted()` ever recurs, it means two PGlite instances collided on the same
  directory (stale process, or a script run concurrently). Fix: stop all node processes touching
  the port/dir, delete `.data/pglite/.s.PGSQL.5432.lock.out` and `postmaster.pid` if present, and
  restart. If the data itself is corrupted (whole app 500s even after a clean restart), move
  `.data/pglite` aside (don't delete outright) and let a fresh one be created + reseeded — it is
  gitignored, local-only, regenerable synthetic demo data, never the user's real evidence.
