# Effort 002 — Addendum: the async fix alone wasn't sufficient

## What happened during verification
After shipping the `await`-based fix (async `getDb`/`deps`, in-flight-promise memoization) and
restarting clean, a **new** divergence appeared while manually re-testing Effort 001's fix live:
- `POST /api/review/[...assetId]` (accept action) returned 200 and, queried immediately via
  `GET /api/review/[...assetId]`, correctly showed `siteId: "plot-b"`, `status: "accepted"`.
- The **page** route `/sites/plot-b` (Server Component), loaded in the same running dev server
  moments later, showed "No photos assigned to this site yet" — as if the write never happened.

## Root cause
Next.js/Turbopack compiles **page routes** and **route handlers** (`api/*`) into separate module
bundles. A module-scoped `let prod: Db | null` in `db.ts` is therefore *not* a true process-wide
singleton — each bundle gets its own copy of that module's top-level state. For the PGlite
fallback specifically (an embedded, in-process WASM Postgres, not an external server), this means
the page bundle and the API bundle end up owning two **separate PGlite client instances**, both
pointed at the same on-disk directory, each with its own independent in-memory view. Writes
through one are invisible to reads through the other until a full process restart forces a fresh
read from disk.

(This same class of bug — two live PGlite instances against one directory — is also the likely
explanation for the earlier `RuntimeError: Aborted()` PGlite crash at the very start of this
session, and for `npm run seed`'s write silently not appearing while the dev server was left
running: same directory, second concurrent instance, undefined behavior.)

## Fix
Anchor the singleton on `globalThis` instead of a module-scoped variable — the one thing
genuinely shared across every bundle in the same Node process. This is the same well-established
pattern used to avoid duplicate Prisma Client instances under Next.js dev/HMR.

```ts
declare global {
  var __saakshyaDb: Db | undefined;
  var __saakshyaDbInit: Promise<Db> | undefined;
}
```

`getDb()` now checks/sets `globalThis.__saakshyaDb` / `globalThis.__saakshyaDbInit` instead of
module-level `let`s.

## Verified live (no restart between steps)
1. Fresh server + reseed.
2. Uploaded a real WhatsApp export batch via `/intake`, accepted `baseline.jpg` to Plot B via the
   API drawer.
3. Set it as Plot B's baseline via the page route — reflected immediately, no restart.
4. Reassigned `followup.jpg` to Plot B via `/review` (API route) — CV registration ran for real
   against the live CV worker, and `/sites/plot-b` (page route) immediately showed the result
   ("REG GOOD · 422 pts", real vegetation-change metrics, a Jev grade) with no restart in between.

This is the concrete regression test for the fix: cross-route-type write-then-read, same process,
no restart, must be consistent. (Not written as an automated Vitest case — it requires two live
Next.js bundle types in one running server, which the unit test harness doesn't spin up; covered
by this manual verification instead.)
