# Specification: SAAKSHYA — Every Site Gets a Chart, Every Claim Needs a Witness

**Hackathon:** Code Cubicle 6.0 · Problem Statement 02 (Cloudinary) · Online 3 Oct · Offline 11 Oct
**Stack:** Cloudinary (perception, transformation, delivery, search) + Jev by TypeSafe AI (every typed decision) + one generative LLM (drafting prose only)
**Replaces:** EcoProof AI (previous spec in git history at `22ab193`)

---

## Problem Statement

An NGO, CSR team or municipal body running physical projects (plantations, lake cleanups, school toilets, borewells, road repairs) produces thousands of photos a year. They arrive through WhatsApp groups, phone galleries and Drive folders: no site labels, different angles each visit, and no link to what was claimed in the last report.

That causes three concrete failures:

1. **Nobody can prove change.** A "before" photo from January and an "after" photo from September are taken from different spots, zooms and angles. Putting them side by side proves nothing. The problem statement asks us to "compare before-and-after media to demonstrate visible change", and today's tooling can't do that honestly.
2. **The only witness is the party being judged.** All evidence comes from the implementer claiming success. Donors, auditors and the community the project serves have no independent channel, so recycled photos, wrong-site photos and staged photos go unnoticed. (This is the same failure SAAKSHI addressed for public spending: the most common fraud is not a faked image but the *same real image reused* across claims.)
3. **Reports aren't traceable.** The quarterly donor report is hand-written prose. Its claims can't be traced to a specific photo, date or measurement, and nothing stops an LLM-written report from inventing progress.

## Solution

SAAKSHYA treats each project site the way a longitudinal imaging study treats a patient:

- **Baseline scan → follow-up scans.** Each site has a baseline photo. Every later visit is a follow-up captured *registered to that baseline*. At capture time the camera shows a translucent "ghost" of the baseline so the photographer lines up the same view. After upload, a registration step computes the geometric alignment and warps the follow-up onto the baseline. Before/after comparisons are then pixel-aligned, not two unrelated photos.
- **A standardized response rubric.** Oncology grades tumour change with RANO/RECIST (complete response, partial response, stable, progression). SAAKSHYA grades site change with **Site Response Criteria (SRC)**, a per-project-type rubric (e.g. plantation: *established / partially established / no change / degraded*). Jev assigns the SRC grade from measured change metrics plus Cloudinary's visual descriptions, with calibrated probabilities. Low-confidence grades go to a human reviewer.
- **Independent witnesses.** Every site has a QR plaque. Any passer-by, beneficiary or volunteer can scan it and submit a registered follow-up photo with no login. Jev triages the citizen submissions at volume. The site chart then shows whether the community's evidence **agrees or disagrees** with the implementer's latest claim.
- **Reports with receipts.** An LLM drafts the donor report *only* from the evidence ledger. Jev then checks every sentence against the evidence it cites. Unsupported sentences are struck out before anyone sees the report. Each surviving sentence links to its source photo, the aligned derivative, the measurement and the Jev decision that backs it.
- **Bulk intake that sorts itself.** Dropping a 500-photo WhatsApp export produces a live triage wall. Each photo is assigned to a site, timepoint and activity, flagged as duplicate/blurry/off-site, or routed for review, in seconds, for a cost shown on screen as the real measured number.

The user sees four surfaces: **Intake** (triage wall), **Site Chart** (timeline, aligned slider, timelapse, SRC grade history, witness agreement), **Witness Capture** (public QR page with ghost-overlay camera) and **Report** (receipt-linked donor report plus exports).

### Why this is the winning framing

- **It meets every PS2 goal with a real mechanism:** organize by project/location/timeline (site charts), identify activities and signals (Cloudinary perception + Jev), before/after (registration + SRC), reports and campaign content (receipt-checked report, timelapse reel), semantic search (Cloudinary search + Jev rerank), traceability (evidence ledger).
- **Cloudinary does real work:** capture overlays, AI captioning and tagging, pHash, derived-asset lineage, aligned comparison rendering, timelapse video, face redaction and search. It's the system of record for pixels and their derivatives, not storage.
- **It uses Jev where Jev is actually strong:** high-volume typed triage, rubric scoring with calibrated confidence, and sentence-level claim checking. The live Jev ecosystem (madewithjev.com, awesome-jev) is crowded with browser agents, games and evals. Almost nothing applies Jev to visual evidence or physical-world verification, so this is open ground.
- **Founder fit:** longitudinal progression grading and image registration is the team lead's research (BraTS Lighthouse progression challenge, BrainGlobe atlas registration). The LLM-proposes / symbolic-layer-decides boundary comes from AtoM-Net. The citizen-witness idea comes from SAAKSHI. Judges reward a team that can explain *why* its method works.

---

## User Stories

### Project setup
1. As a program manager, I want to create a project with a type (plantation, cleanup, water point, sanitation, construction), so that the right Site Response Criteria are applied to its sites.
2. As a program manager, I want to register a site with a name, GPS point and radius, so that incoming photos can be matched to it by location.
3. As a program manager, I want to designate a baseline photo for each site, so that every future photo is compared against the same reference.
4. As a program manager, I want to replace a site's baseline and keep the old one in history, so that a bad first photo doesn't ruin the site's record.
5. As a program manager, I want to print a QR plaque for each site, so that anyone at the site can contribute evidence.
6. As a program manager, I want to write the claim for each reporting period ("300 saplings planted in plot B"), so that the evidence is checked against a specific, stated claim.
7. As a program manager, I want to see the SRC rubric that will grade my project type, so that I know in advance what "success" means.

### Bulk intake and triage
8. As a field coordinator, I want to drop a folder or ZIP of hundreds of photos, so that I don't have to sort them by hand.
9. As a field coordinator, I want to import a WhatsApp chat export, so that photos shared in groups become evidence without re-uploading.
10. As a field coordinator, I want photos to upload directly to Cloudinary from my browser, so that large batches don't fail on server limits.
11. As a field coordinator, I want a live triage wall where each photo card shows its assigned site, timepoint, activity and status as decisions come in, so that I can see the batch being organized.
12. As a field coordinator, I want photos with no GPS to be assigned to a site using visual and text cues, and marked as location-inferred, so that they're usable without being treated as location-verified.
13. As a field coordinator, I want duplicates and near-duplicates grouped automatically, so that the same moment isn't counted twice.
14. As a field coordinator, I want blurry, dark or irrelevant photos (selfies, screenshots, memes) filtered out with the reason shown, so that the evidence set stays clean.
15. As a field coordinator, I want to override any triage decision with one click, so that the system never locks me into a wrong call.
16. As a field coordinator, I want to see the total batch time and the actual cost of the decisions, so that I trust this scales to the whole archive.
17. As a field coordinator, I want photos whose decision confidence is below threshold to land in a "needs review" lane, so that I only look at the hard ones.

### Registered capture (field staff and citizens)
18. As a field worker, I want the camera view to show the site baseline as a translucent ghost overlay, so that I can line up the same framing as the first visit.
19. As a field worker, I want an alignment indicator that turns green when my framing matches the baseline, so that I know when to take the shot.
20. As a field worker, I want to capture offline and have the upload retry when I have signal, so that remote sites still produce evidence.
21. As a citizen at a site, I want to scan a QR code and submit a photo with no account, so that contributing takes under a minute.
22. As a citizen, I want the capture page in Hindi and English, so that I can use it comfortably.
23. As a citizen, I want to add an optional one-line comment ("pipe is broken again"), so that I can report what the photo shows.
24. As a citizen, I want to see a thank-you with the site's current status, so that I know my submission counted.
25. As a community member photographed in a submission, I want my face automatically blurred in every public view, so that my privacy is protected.

### Registration and measurement
26. As a program manager, I want every follow-up photo automatically aligned to its site baseline, so that before/after comparisons are the same view.
27. As an auditor, I want each alignment to report a quality score, so that I can tell a well-registered pair from a forced one.
28. As an auditor, I want photos that fail to register against the baseline flagged as "possibly different location", so that wrong-site submissions are caught by geometry, not opinion.
29. As a program manager, I want measured change metrics for each aligned pair (vegetation cover change, changed-area fraction, and per-type metrics), so that "progress" is a number, not an adjective.
30. As a program manager, I want the aligned before/after shown as a drag slider and a difference overlay, so that the change is visually obvious.

### Site Response grading
31. As a program manager, I want each site graded on SRC at every timepoint, so that I have a consistent progression record.
32. As an auditor, I want each SRC grade to show its probability distribution and confidence, so that I can see how certain the grading was.
33. As an auditor, I want grades below the confidence threshold routed to a human reviewer with the evidence laid out, so that uncertain cases are never auto-certified.
34. As a reviewer, I want to accept or change an SRC grade and record a reason, so that human judgement becomes part of the record.
35. As a program manager, I want a site's grade history on a timeline, so that I can see if a site is improving, stalling or degrading.
36. As a program manager, I want degrading sites surfaced on the dashboard first, so that I can act before the donor asks.

### Integrity checks
37. As an auditor, I want photos that reuse (or nearly reuse) an image already submitted for another site or period flagged, so that recycled evidence is caught.
38. As an auditor, I want photos whose capture date doesn't match their claimed period flagged, so that old photos can't pose as new progress.
39. As an auditor, I want photos whose GPS falls outside the site radius flagged, so that off-site evidence is caught.
40. As an auditor, I want each flag to state exactly which check fired and on which assets, so that I can verify it myself.
41. As a donor, I want to see whether citizen witnesses agree with the implementer's claim for each site, so that I have an independent signal.
42. As a program manager, I want a site where citizen evidence contradicts the claim marked "contested", so that disagreements are investigated, not buried.

### Search and discovery
43. As a communications officer, I want to search in plain language ("water point with people queueing, after June"), so that I find the right photo without knowing tags.
44. As a communications officer, I want to filter by project, site, SRC grade, date range, contributor type and flags, so that I can narrow results precisely.
45. As a communications officer, I want search results ranked by relevance to my query, not just by tag overlap, so that the best match comes first.

### Reports and content
46. As a program manager, I want a donor report generated for a period, so that I don't write it from scratch.
47. As a donor, I want every sentence in the report linked to the photos and measurements that support it, so that I can check any claim in one click.
48. As an auditor, I want sentences the evidence doesn't support removed or visibly struck out, so that the report can't overclaim.
49. As a program manager, I want to see which sentences were struck and why, so that I can collect the missing evidence or soften the claim.
50. As a communications officer, I want an automatically generated timelapse video of each site from its aligned photos, with dates burned in, so that I have campaign-ready content.
51. As a communications officer, I want social-ready crops (square, vertical) of the best before/after, so that I can post immediately.
52. As a program manager, I want to export the report as a shareable web page and a PDF, so that I can send it to donors.
53. As a donor, I want a public site page reachable from the QR plaque, showing the grade history and aligned timelapse, so that the evidence is open.

### Traceability and trust
54. As an auditor, I want to follow any report sentence back to the decision, then the measurement, then the aligned derivative, then the original upload, so that the full chain is inspectable.
55. As an auditor, I want every automated decision stored with the model name and version, question, inputs, probabilities and timestamp, so that decisions can be reproduced and challenged.
56. As an auditor, I want original uploads never modified or deleted by the system, so that the source of truth is preserved.
57. As a judge or skeptic, I want a calibration panel showing the decision layer's accuracy, Brier score and calibration error on a labelled holdout set, so that confidence numbers mean something.
58. As any user, I want to see clearly when the decision service is unavailable and decisions are pending, so that I never see fabricated numbers.

---

## Implementation Decisions

### Division of labour (non-negotiable boundary)
- **Cloudinary perceives and renders.** Upload, AI captioning and tagging, OCR where present, EXIF extraction, perceptual hash, face redaction, derived-asset storage, overlays, comparison rendering, timelapse video, search.
- **Deterministic code measures.** Registration (feature matching + robust homography), registration quality, change metrics, GPS/radius checks, date checks, perceptual-hash distance. These are numbers, not opinions.
- **Jev decides.** Every discrete judgement (site assignment, relevance, activity, SRC grade, witness agreement, sentence support, search rerank) is a Jev `Choice`, `Score` or `Noul` over a text/JSON state built from Cloudinary's descriptions plus the deterministic measurements. Jev's hosted model is text-only and does not see pixels (per TypeSafe's launch post and awesome-jev caveats), and the design depends on that.
- **The generative LLM only drafts prose.** It never decides a grade, flag or verdict and cannot overrule Jev. Its output is untrusted until the sentence checker passes it.

### Modules

1. **Media Gateway (Cloudinary adapter).** One interface over Cloudinary: signed direct-upload parameters, retrieval of the analysis results for an asset (caption, tags, OCR text, EXIF, pHash, faces), creation of derived assets with lineage context (source asset id, transform parameters, homography), URL builders for ghost overlay, aligned slider, difference overlay, social crops, face-redacted public delivery and site timelapse, and a search query builder. The rest of the system never builds Cloudinary URLs by hand.
2. **Registration Service.** Input: baseline asset + follow-up asset. Output: homography matrix, inlier count/ratio, a quality grade (`good` / `weak` / `failed`), and the aligned derivative (uploaded through the Media Gateway). Runs as a small Python worker (OpenCV feature matching with robust estimation), called over HTTP. `failed` registration is itself evidence ("possibly different location").
3. **Change Metrics.** Input: aligned pair. Output: per-project-type metrics, e.g. vegetation-cover fraction change (visible-band excess-green), changed-area fraction, mean brightness shift (to catch lighting-only change). Deterministic and pure. Lives with the Registration Service.
4. **Decision Client (Jev adapter).** One interface: `decide(state, questions) → typed answers + probabilities + confidence + model version + latency`. Handles batching (many assets per request where questions share state shape), timeouts and retries. **No fabricated fallback.** If Jev is unreachable, decisions are recorded as `pending` and the UI says so. Pins the model version (currently `jev-1.13.x`) so decisions are reproducible. Keeps choice cardinality ≤255 by pre-filtering candidates (e.g. sites within GPS range) before asking.
5. **Evidence Ledger.** The system of record for sites, timepoints, assets, derivatives, measurements, decisions, human overrides, claims and report sentences, with links between them. Append-only for decisions and overrides. Backed by Postgres (Supabase or Neon) so the demo survives restarts and multiple viewers.
6. **Evidence Pipeline.** Orchestrates one asset from upload to ledger: fetch Cloudinary analysis → integrity checks (GPS radius, date window, pHash distance against the ledger) → Jev triage (site, relevance, activity) → registration + metrics if it belongs to a site with a baseline → recompute that site's timepoint SRC grade → recompute witness agreement. Exposes `ingest(assetId, source)` and `assessSite(siteId, timepoint)`.
7. **Site Response Criteria.** Declarative rubric definitions per project type. Each has ordered levels with descriptions, the metrics that inform it, and thresholds for human review. Graded via Jev `Score`. Example (plantation): 0 degraded, 1 no change, 2 partially established, 3 established.
8. **Witness Channel.** The public QR capture flow: rate-limited anonymous upload scoped to one site, ghost-overlay camera, optional comment, face redaction on all public delivery. Witness agreement for a site/period is a Jev `Choice` (`corroborates` / `contradicts` / `insufficient`) over the claim, implementer evidence summaries and witness evidence summaries.
9. **Report Composer.** Builds a period report: the LLM drafts from a ledger digest where each fact carries an evidence id. The **Sentence Checker** splits the draft into sentences and asks Jev one `Noul` per sentence ("Is this sentence fully supported by the cited evidence?") against only the cited evidence. Sentences below threshold are struck, with the reason kept. Output: web page (public link) and PDF.
10. **Search.** Cloudinary search for candidate retrieval (tags, metadata, date, folder), then Jev `Noul` relevance rerank against each candidate's text card (caption, tags, site, SRC grade, comment).
11. **Calibration Harness.** Runs the Jev question set against a hand-labelled holdout of the team's own photos and reports accuracy, Brier score, expected calibration error and a reliability curve. Used to choose review thresholds and shown in the UI.

### Jev question set (decision contract)
| Decision | Primitive | State given to Jev |
|---|---|---|
| Site assignment | `Choice` over ≤N nearby sites + `none` | caption, tags, OCR, GPS distance to each candidate, comment |
| Relevance | `Choice`: `evidence` / `people_only` / `screenshot_or_meme` / `unusable_quality` | caption, tags, quality signals |
| Activity | `Choice` over project-type activities | caption, tags, OCR |
| SRC grade | `Score` over the project type's rubric levels | baseline + follow-up captions, change metrics, registration quality, days elapsed |
| Witness agreement | `Choice`: `corroborates` / `contradicts` / `insufficient` | claim text, implementer and witness evidence summaries, their SRC grades |
| Sentence support | `Noul` | one sentence + text of its cited evidence |
| Search relevance | `Noul` | query + asset text card |

### Key data shapes
- **Site:** id, project id, name, GPS point, radius, baseline asset id, QR slug.
- **Evidence item:** asset id, source (`implementer` / `witness` / `bulk_import`), site id or null, timepoint, capture time, GPS, integrity flags, status (`accepted` / `needs_review` / `rejected` / `pending`).
- **Derivative:** source asset id, baseline asset id, homography, registration quality, derived asset id.
- **Decision record:** subject id, decision kind, question, state hash, answer, probability distribution, confidence, model and version, latency, cost, timestamp, overridden-by.
- **Report sentence:** text, cited evidence ids, support probability, status (`kept` / `struck`), reason.

### Surfaces
- **Intake:** drag-drop/ZIP/WhatsApp-export import and the live triage wall (cards animate into site lanes; the review lane is highlighted; real batch time and cost shown).
- **Site Chart:** baseline, timeline of timepoints, aligned slider + difference overlay, SRC grade history with confidence, integrity flags, witness agreement badge, timelapse.
- **Witness Capture:** public, mobile-first, bilingual, ghost overlay, offline retry.
- **Report:** receipt-linked sentences, struck-sentence panel, exports, public page.
- **Trust panel:** calibration metrics and decision-service status.

### Design direction
Remove the "command terminal" aesthetic and the projected-benchmark tickers. The visual language should be an evidence dossier / medical chart: light default with dark mode, strong typography, photos as the hero, and restrained colour reserved for SRC grades and flags. Every number shown must be measured, never projected.

---

## Testing Decisions

- **A good test here** exercises external behaviour through the highest seam: given recorded Cloudinary analysis results and recorded (or scripted) Jev answers, assert what lands in the ledger and what the API returns. Tests must not assert on prompt wording, internal helper calls or URL string internals beyond "points at the right asset with the right lineage".
- **Primary seam: the Evidence Pipeline** (`ingest`, `assessSite`) and the Report Composer, run with three swappable ports: Media Gateway, Decision Client and Registration Service. Tests use in-memory fakes loaded from recorded fixtures of real assets, so the full pipeline is exercised without network access. This replaces today's pattern of hardcoded mock constants inside the Jev module.
- **Scenarios to cover at that seam:**
  - clean follow-up → aligned, graded, accepted
  - same image reused at another site → recycled flag
  - old capture date → date flag
  - off-radius GPS → location flag
  - registration failure → possible-different-location flag
  - low-confidence grade → review lane
  - witness contradicts claim → contested
  - report with an unsupported sentence → struck, with reason
  - Jev unavailable → decisions `pending`, no fabricated values
- **Registration Service and Change Metrics** get their own tests against a small committed set of real image pairs (well-aligned pair, shifted/rotated pair, different-location pair), asserting quality grade and metric direction.
- **Calibration Harness** is not a unit test. It's a scripted evaluation run against the live Jev API on the labelled holdout, with results committed as an artifact and shown in the Trust panel.
- **Prior art:** the existing route-level tests that call route handlers directly with fixture payloads (the verify, search and narrative API tests under the Vitest suite) are the model. Keep that style, but point it at the pipeline seam with injected fakes instead of hardcoded module-level mocks.

---

## Out of Scope

- Satellite or drone orthomosaic analysis (field phone photos only).
- C2PA signing, blockchain anchoring and carbon-credit issuance/registry integration.
- Native mobile apps (the capture flow is a mobile web page/PWA).
- Training or fine-tuning custom vision models. Perception comes from Cloudinary; decisions come from Jev.
- Multi-tenant org management, SSO and fine-grained roles beyond `manager`, `reviewer` and public `witness`.
- Voice-line intake (a natural SAAKSHI follow-up, listed for later).
- Pixel-level object counting (e.g. "exactly 312 saplings"). SRC grades are rubric-level on purpose.

---

## Further Notes

### Real data is the product
The demo must run on **real photos the team captures**, not stock images. Plan: from now to 2 Oct, pick 4–5 sites in Delhi where change is visible within days (an active construction/repair site, a garbage point before/after a cleanup drive the team joins or organizes, a new plantation, a lake or drain edge, a public toilet or water point). Capture a registered baseline and daily follow-ups with the ghost overlay, plus some unaligned casual shots. Deliberately plant the fraud cases:
- one photo reused across two sites
- one old photo presented as new
- one photo from a different location
- one stock image

Hand-label ~150 photos as the calibration holdout.

### Demo script (≈4 minutes)
1. Drop a ~300-photo WhatsApp export. The triage wall sorts it live, and the measured time and cost appear.
2. Open a Site Chart: aligned slider, SRC grade history with confidence, timelapse.
3. Show the four planted frauds being caught, each with the exact check that fired.
4. A judge scans the site QR on their own phone, sees the ghost overlay and submits a photo. Witness agreement updates.
5. Generate the donor report. One overclaiming sentence gets struck live. Click a kept sentence and walk the chain back to the original upload.
6. Trust panel: calibration numbers on the holdout.

### Verify before building (unproven assumptions)
- Which Cloudinary analysis add-ons (AI captioning, auto-tagging, OCR) are enabled on the team's plan and their quotas. Design so each missing signal degrades to "not available", never to invented text.
- That the difference-blend overlay and multi-image timelapse/slideshow generation render as expected on the team's cloud. If not, compute the difference image in the Registration Service and upload it as a derivative.
- Jev API access, current model version, rate limits and batching behaviour with the team's key.

### Reuse from the current codebase
Keep the Next.js app shell, signed direct upload, and the route-handler + Vitest structure. Replace the hardcoded demo fixtures, the mock-constant fallback in the Jev module, the FinOps ticker and the three-column terminal layout.

### Sources consulted
- TypeSafe AI, *Introducing System One Models & Jev*: https://typesafe.ai/blog/introducing-system-one-models-and-jev
- Community project directory: https://madewithjev.com/
- awesome-jev (155+ projects, caveats on text-only input and confidence): https://github.com/cobanov/awesome-jev
- Cloudinary Agents launch (May 2026): https://www.businesswire.com/news/home/20260505410851/en/Cloudinary-Launches-AI-Agents-to-Streamline-Enterprise-Scale-Visual-Media-Management-and-Brand-Governance
- Cloudinary hackathon 2026 submissions (to see what's crowded): https://hackindia.org/2026/pixels-to-products-cloudinary-ai-hackathon-2026
