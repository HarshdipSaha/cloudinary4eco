# Effort 002 — Characterization: PGlite migration race condition

## Symptom (reproduced live, 2026-09-25)
After force-restarting the dev server mid-request (during Effort 001 verification, killing the
process while a request was in flight against a fresh/rebuilt local PGlite data directory), the
entire app started returning 500 on every route: `error: relation "projects" does not exist`.

## Root cause
`src/ledger/db.ts#getDb()`, PGlite fallback branch (used whenever `DATABASE_URL` is unset):
```ts
const client = new PGlite(dataDir);
const db = drizzlePglite(client, { schema });
if (!migrationDone) {
  migrationDone = true;                          // ← flips true immediately
  migrate(db as any, { migrationsFolder }).catch(() => {});  // ← not awaited
}
prod = db;
return prod;                                      // ← returned before migration finishes
```
`migrationDone` is set `true` and the db handle is returned to the caller *before* `migrate()`
resolves. `migrate()` reads migration SQL files from disk and issues DDL sequentially — real,
non-zero time. If a query arrives before that finishes (near-guaranteed on a fresh/empty PGlite
directory under a fast dev-server cold start, e.g. immediately after wiping `.data/pglite`), it
executes against a database with no tables yet.

This is a genuine race, not a one-off: reproduced by wiping `.data/pglite` and restarting twice
in a row, both times hitting the exact same error on the very first request.

## Why this wasn't caught by the existing test suite
Tests use `createTestDb()`, a separate exported function that **does** `await migrate(...)`
before returning — it never exercises `getDb()`'s fire-and-forget PGlite branch at all. The two
code paths diverged: one correct (test), one racy (dev fallback).

## Blast radius / scope of fix
Only affects the local PGlite dev-fallback path (`DATABASE_URL` unset). Production/Neon path is
unaffected — that branch never calls `migrate()` (migrations are applied out-of-band via
`npm run db:migrate`). The window is narrow (first request after a cold, empty PGlite directory)
but real, and just bit this session directly.

## Fix approach
Make `getDb()` properly `async` and `await migrate(...)` before returning `prod`. This requires
`adapters/container.ts#build()`/`deps()` to become `async` too (it calls `getDb()`), which in
turn requires every call site of `getDb()` (14) and `deps()` (13, overlapping) to add `await` —
all of them are already inside `async function` server components or route handlers, so this is
a mechanical one-word addition at each site, not a redesign. No behavior change for the Neon
path (constructing `drizzleNeon(...)` is already synchronous; wrapping it in an async function
that resolves immediately is a no-op).

## Test specification
Cannot practically unit-test the exact race window (it's a real-time file I/O race). Instead:
add a regression test in `src/test/ledger.test.ts`-adjacent file that imports a **fresh**
instance of `ledger/db.ts` (via `vi.resetModules()`), pointed at a brand-new empty temp
directory with `DATABASE_URL` unset, calls the new `async getDb()`, and immediately issues a
query — asserting it succeeds. Before the fix this reliably fails (empty dir → migration takes
measurable time → immediate query hits "relation does not exist"); after the fix it must
reliably pass, because `getDb()` cannot return until migration is done.
