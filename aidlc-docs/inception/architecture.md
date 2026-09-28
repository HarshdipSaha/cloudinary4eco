# SAAKSHYA — Architecture Baseline

Reverse-engineered from `web/src` on 2026-09-25. Two deployables per `docs/PRODUCT.md`: this Next.js
web app, and a separate Python CV worker (`cv/`, FastAPI + OpenCV, not covered in depth here
since it wasn't running/modified in this effort).

## Stack
Next.js 15 (App Router, TS, React 19, Turbopack dev) · Drizzle ORM over Postgres (Neon serverless
HTTP driver) with a **persistent PGlite fallback** when `DATABASE_URL` is unset
(`src/ledger/db.ts`) · Cloudinary (media storage + perception) · TypeSafe "Jev" (typed/calibrated
decisions, `@typesafe-ai/sdk`) · Groq (drafting LLM, prose only, multi-key rotation) · Zod for
API validation · Tailwind v4 · Vitest + Playwright.

## Layering (ports & adapters / hexagonal)
```
app/                 Next.js routes: (console) UI + API, (paper) public pages
  (console)/         Dashboard, /setup, /intake, /review, /search, /reports, /trust, /sites/[id]
  (paper)/           /plaque/[slug], /r/[slug] (report), /s/[slug] (site), /w/[slug] (witness)
  api/               REST-ish handlers; call pipeline/* via adapters/container.ts
ui/                  React components (client), grouped by feature (intake, review, site, hanging…)
pipeline/            Use-case orchestration: ingest.ts, review.ts, assess.ts, agreement.ts
domain/              Pure logic, no I/O: types, geo, integrity, status, thresholds, timepoint,
                     whatsapp parsing, calibration, exif, phash, src-rubrics
ports/               Interfaces the pipeline depends on: media, decisions, registration, drafter
adapters/            Concrete implementations of the ports + container.ts (manual DI, memoized)
  cloudinary/        MediaPort — upload signing, analysis mapping, delivery URLs
  jev/               DecisionsPort — typed triage/grading calls to TypeSafe
  cv/                RegistrationPort — HTTP client to the separate Python CV worker
  llm/groq.ts        DrafterPort — prose generation only, never decisions
ledger/              Persistence: db.ts (connection), schema.ts (Drizzle tables), repo.ts (queries)
reports/             compose.ts / digest.ts / sentences.ts — turns ledger data into report prose
search/              search.ts — builds Cloudinary search expressions from filters
test/                fakes.ts (in-memory port fakes), fixtures/, vitest specs
```

Dependency rule: `domain` has no imports from `adapters`/`app`. `pipeline` depends on `ports`
(interfaces) and `domain`, never directly on `adapters`. `adapters/container.ts` is the single
place concrete adapters are wired to ports — swappable for tests via `test/fakes.ts`.

## Data flow (intake → review → reading)
1. Client uploads directly to Cloudinary using a signature from `POST /api/uploads/sign`
   (`adapters/cloudinary/gateway.ts#signUpload`); `ANALYSIS_UPLOAD_PARAMS` sets what Cloudinary
   computes at upload time — **must match what the account actually supports** (see
   requirements.md "known account-level constraint").
2. `pipeline/ingest.ts#ingestBatch`: analyze (Cloudinary) → record `pending` evidence row →
   Jev triage (site/relevance/activity) → per-asset: integrity checks (`domain/integrity.ts`),
   CV registration against the site baseline if one exists, status decision
   (`domain/status.ts#decideStatus`), persist, then grade any touched site/timepoint
   (`pipeline/assess.ts`) and refresh witness agreement (`pipeline/agreement.ts`).
3. **Timepoint gating**: an evidence row only gets a `timepoint` (`domain/timepoint.ts#timepointOf`,
   a calendar day in IST) when it has a resolved `capturedAt` (EXIF, or WhatsApp message send
   time as fallback). Grading (`assessSite`) only ever runs for timepoints that exist. This is
   the mechanism behind the bug fixed in effort 001 — see its `characterization.md`.
2. `pipeline/review.ts#applyReview`: human overrides (accept/set_aside/assign_site), always
   with a reason, always recorded via `repo.recordOverride` before mutating state (audit trail).
3. `src/app/(console)/sites/[siteId]/page.tsx` → `repo.siteChart` → `ui/site/ReadingPanel.tsx`:
   renders the per-site timeline strictly from **graded timepoints**
   (`repo.assessmentsForSite`); the baseline-candidate picker (shown when `site.baselineAssetId`
   is null) reused this same `timepoints` list, which is the root cause fixed in effort 001.

## Routing conventions worth preserving
- Any URL param that carries a Cloudinary `public_id` (which always contains `/` folder
  segments, e.g. `saakshya/<project>/<source>/<id>`) **must** be a catch-all segment
  (`[...assetId]`), never a single dynamic segment (`[assetId]`). Fixed once already in
  `api/review/[...assetId]/route.ts`; if a new route takes an assetId in the path, follow the
  same pattern.

## External service degradation contract
`src/app/api/status/route.ts` polls Jev/Cloudinary/CV independently (30s cache) and reports
`up`/`down` with the real error message truncated. The console banner and `ingestBatch`'s
`DecisionsUnavailable`/`RegistrationUnavailable` catches turn any dependency outage into a
`pending` status + a plain-language reason — never a fabricated grade. Any new adapter must
follow this same "typed unavailable exception → pending, not guessed" contract.
