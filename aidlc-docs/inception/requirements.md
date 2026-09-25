# SAAKSHYA — Requirements Baseline

Source: reverse-engineered from `PRODUCT.md`, `SPECIFICATION_DOCUMENT.md`, `DESIGN.md` and
live behavior verified by hand-testing on 2026-09-25. Not re-interviewed with the user because
these documents already encode the product's requirements in detail.

## Purpose
Turn an unsorted pile of field photos into longitudinal, verifiable evidence per site: a
baseline, registered follow-ups, a graded response on a standard rubric, independent citizen
witnesses, and reports where every sentence links to its proof.

## Primary users
- Program manager / auditor (NGO, CSR, municipal body) — desk-based, sorts photos, resolves
  flags, assembles donor reports, accountable for claims.
- Secondary: field workers / citizens (phone, outdoor, one-handed capture via QR); donors and
  public (read-only report/site pages).

## Functional requirements (as implemented)
1. **Setup** — create projects, sites (geo-fenced, radius), claim periods, baselines.
2. **Intake** — bulk import photos / WhatsApp `.zip` exports; Cloudinary analysis
   (metadata, phash, faces — NOT captioning/tagging/OCR add-ons, account has no subscription
   for those); Jev triage (site match, relevance, activity) with token/cost accounting.
3. **Review** — human-in-the-loop queue (integrity flags first, then low-confidence), every
   override requires a typed reason (audit trail), actions: accept / set aside / assign site.
4. **Reading (Sites)** — per-site timeline of timepoints, each graded on Site Response Criteria
   (SRC), baseline vs. follow-up registration (CV worker), manual grade override with reason.
5. **Search** — query evidence by project/site/date/status.
6. **Reports** — compose donor-facing reports where every claim links to underlying evidence
   ("receipt").
7. **Trust** — dashboard of service health / decision provenance.
8. **Witness** — public/independent citizen photo submission per site, agreement
   (corroborates/contradicts/insufficient) against implementer evidence.
9. **Public pages** — QR plaque → site page, witness page, report page (`(paper)` route group).

## Non-functional / product principles (binding constraints)
1. **Measure, then decide, then write**: numbers from deterministic code, judgements from Jev,
   prose last and checked.
2. **Every claim carries a receipt.**
3. **Uncertainty is shown, never hidden.** A down/unsubscribed service must mark decisions
   *pending*, never guess or fabricate a value. Verified live: `/api/status` reports each
   dependency (Jev/Cloudinary/CV) independently; the console banner surfaces failures in plain
   language.
4. **The community is a witness, not an audience.**
5. **Nothing on screen is projected or invented.**
6. Faces pixelated in every public view; original uploads never modified/deleted.
7. Jev is text-only, choice cardinality ≤255, model version pinned.
8. WCAG 2.2 AA; capture page must work outdoors, one-handed, low-end Android, flaky network.

## Known account-level constraint (discovered, not assumed)
The configured Cloudinary account has **no active subscription** for AI Content Analysis
(captioning), Google/AWS auto-tagging, or OCR. Only base analysis (`image_metadata`, `phash`,
`faces`) is available. This is now the actual contract in `gateway.ts` — do not silently re-add
those add-on params; if the plan changes, re-run `npm run probe:cloudinary` and diff the report.

## Explicitly out of scope for this baseline
- CV worker (Python/FastAPI/OpenCV) deployment — exists as a separate deployable (`cv/`), not
  running in this dev environment; registration decisions correctly degrade to "pending" per
  principle 3.
- Multi-tenant / auth — not evaluated.
