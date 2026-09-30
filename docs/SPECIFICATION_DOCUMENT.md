# Specification: SAAKSHYA — Every Site Gets a Chart, Every Claim Needs a Witness

**Hackathon:** Code Cubicle 6.0 · Problem Statement 02 (Cloudinary) · Online 3 Oct · Offline 11 Oct
**Current stack:** Next.js + TypeScript; Cloudinary for signed media upload, available metadata, transformations, and structured search; a Python/OpenCV worker for registration and change metrics; Jev for typed decisions; Groq-backed prose drafting; PostgreSQL-compatible evidence ledger.

**Status:** This document contains both an as-built description and an aspirational requirements backlog. Only the capabilities listed in "Current implementation" are claims about the current application. Stories below are product requirements and are not evidence that a feature has shipped.

---

## Problem Statement

An NGO, CSR team or municipal body running physical projects (plantations, lake cleanups, school toilets, borewells, road repairs) produces thousands of photos a year. They arrive through WhatsApp groups, phone galleries and Drive folders: no site labels, different angles each visit, and no link to what was claimed in the last report.

That causes three concrete failures:

1. **Nobody can prove change.** A "before" photo from January and an "after" photo from September are taken from different spots, zooms and angles. Putting them side by side proves nothing. The problem statement asks us to "compare before-and-after media to demonstrate visible change", and today's tooling can't do that honestly.
2. **The only witness is the party being judged.** When evidence comes only from the implementer claiming success, donors, auditors, and the community have no independent channel to flag recycled photos, wrong-site photos, or staged photos.
3. **Reports aren't traceable.** The quarterly donor report is hand-written prose. Its claims can't be traced to a specific photo, date or measurement, and nothing stops an LLM-written report from inventing progress.

## Current implementation

The current application supports browser-to-Cloudinary signed image uploads; extraction of available metadata, pHash, face count, and tags; evidence ingestion and integrity checks; Python/OpenCV registration and change metrics; typed Jev decisions; public witness submissions; structured evidence search; and reports whose sentences are recorded as kept, struck, or pending against cited ledger facts. The public report view shows kept sentences; the internal report view also exposes struck and pending items. Print / PDF uses the browser print dialog.

Cloudinary AI captioning, automatic tagging, and OCR are not enabled on the account described by the checked-in capability probe. Caption and OCR fields are parsed only if returned; they are not a reliable input signal. Cloudinary does not compute registration or difference images. The Python/OpenCV worker performs those tasks.

Public video import accepts a permitted Cloudinary video URL and creates three still-frame evidence items. It does not analyze all frames, audio, or motion and does not splice or reframe video. C2PA signing, automatic video reels/timelapses, 500-photo import guarantees, and "zero local image processing" are not current capabilities.

### Product direction

The product direction is site-based evidence over time: compare follow-up imagery to a baseline, accept independent witness evidence, and make report claims inspectable. Requirements that are not in the current implementation remain in the backlog below and should not be described as shipped.

---

## Product Requirements Backlog

The following stories describe desired product behavior. Delivery status varies; they are not current capability claims unless independently confirmed in the "Current implementation" section and the code.

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

## Current Architecture and Implementation Notes

### Division of labour
- **Cloudinary uploads and serves media.** The adapter signs browser uploads with `image_metadata`, `phash`, and `faces`; requests those fields plus tags and context on lookup; builds selected image transformation URLs; imports permitted public video assets and renders three still frames; and runs structured search expressions. Optional caption/OCR fields are parsed when returned. The checked-in probe shows those AI add-ons unavailable on the current account.
- **The Python/OpenCV worker measures images.** It performs image registration, reports registration quality, and produces aligned/difference derivatives and change metrics. GPS/radius, date-window, and pHash integrity checks run in application code.
- **Jev makes typed decisions.** The application supplies evidence and measurements for triage, grading, witness agreement, and report sentence support. The system records unavailable decisions as pending.
- **The generative model drafts prose.** Draft sentences are checked against facts in the ledger. The model does not provide visual analysis or the deterministic image metrics.

### Modules

1. **Media Gateway (Cloudinary adapter).** Signs uploads, reads available metadata and analysis fields, imports permitted public videos and extracts three stills, builds selected image delivery/composition URLs, and retrieves asset IDs through structured search expressions. The adapter does not call Cloudinary OCR/captioning add-ons, create difference images, or generate videos.
2. **Registration Service.** A Python worker uses OpenCV to align a baseline/follow-up pair and returns registration quality, measurements, and aligned/difference derivatives. A failed registration can create a possible-different-location flag.
3. **Change Metrics.** The Python worker returns the currently implemented vegetation-fraction, changed-area, and brightness-shift measurements for a registered pair.
4. **Decision Client (Jev adapter).** Provides typed decisions and records model information and usage where returned. If Jev is unavailable, decision records are pending rather than fabricated.
5. **Evidence Ledger.** Stores projects, sites, evidence, derivatives, measurements, decisions, claims, witness agreements, and report sentences in the configured database. Local development can use PGlite; hosted deployments use a PostgreSQL-compatible service.
6. **Evidence Pipeline.** Ingests available media analysis, performs integrity checks, requests Jev triage, registers evidence against a baseline when applicable, stores derivatives/metrics, assesses sites, and updates witness agreement when evidence and an active claim permit it.
7. **Site Response Criteria.** Rubrics define grades and review thresholds by project type. Jev grades a site using supplied measurements and registration information.
8. **Witness Channel.** Public witness submissions are scoped to a site and pass through the evidence pipeline. When a claim and witness evidence are present, the application can ask Jev for an agreement decision; unavailable decisions remain pending. Public redaction depends on use of the relevant image URL helpers.
9. **Report Composer.** Drafts from a ledger digest whose facts carry evidence IDs, then asks Jev to check eligible sentences against their cited facts. Unsupported or uncited sentences are struck; unavailable checks are pending. The public route shows kept sentences. Print / PDF is provided by the browser print dialog.
10. **Search.** Cloudinary adapter search accepts structured expressions and returns candidate asset IDs. Application search and ranking are separate from Cloudinary; this adapter does not provide free-text semantic search.
11. **Calibration Harness.** Any calibration display or threshold claim must be based on a documented labeled set and evaluation run. Do not imply production-grade calibration from a small development sample.

### Jev question set (decision contract)
| Decision | Primitive | State given to Jev |
|---|---|---|
| Site assignment | `Choice` over ≤N nearby sites + `none` | available caption/tags/text, GPS distance to each candidate, comment; caption and OCR may be absent |
| Relevance | `Choice`: `evidence` / `people_only` / `screenshot_or_meme` / `unusable_quality` | available text and metadata, quality signals |
| Activity | `Choice` over project-type activities | available text and metadata; caption/OCR are not guaranteed |
| SRC grade | `Score` over the project type's rubric levels | available baseline/follow-up text, change metrics, registration quality, and days elapsed |
| Witness agreement | `Choice`: `corroborates` / `contradicts` / `insufficient` | claim text, implementer and witness evidence summaries, their SRC grades |
| Sentence support | `Noul` | one sentence + text of its cited evidence |
| Search relevance | `Noul` | query + asset text card |

### Key data shapes
- **Site:** id, project id, name, GPS point, radius, baseline asset id, QR slug.
- **Evidence item:** asset id, source (`implementer` / `witness` / `bulk_import`), site id or null, timepoint, capture time, GPS, integrity flags, status (`accepted` / `needs_review` / `rejected` / `pending`).
- **Derivative:** source asset id, baseline asset id, homography, registration quality, derived asset id.
- **Decision record:** subject id, decision kind, question, state hash, answer, probability distribution, confidence, model and version, latency, cost, timestamp, overridden-by.
- **Report sentence:** text, cited evidence ids, support probability, status (`kept` / `struck`), reason.

### Application surfaces
- **Intake and review:** image evidence intake, processing status, and review of evidence/flags. Do not imply ZIP/WhatsApp-export parsing or a tested 500-photo throughput unless demonstrated separately.
- **Sites:** site list and site detail with evidence, baseline/follow-up comparison, registration information, and assessments where data exists.
- **Witness:** public site-scoped evidence submission; witness agreement is computed only when a relevant claim and witness evidence exist and the decision service is available.
- **Reports:** internal kept/struck/pending sentences, a public view of kept sentences, shareable route, and browser print / PDF.
- **Search and trust:** application search can rerank text queries; the Cloudinary adapter itself only retrieves candidates by structured expression. Trust data is shown when a calibration result artifact is available.

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
- Native mobile apps.
- Training or fine-tuning custom vision models. Current image registration and metrics use OpenCV; Cloudinary supplies media and available metadata.
- Multi-tenant org management, SSO and fine-grained roles beyond `manager`, `reviewer` and public `witness`.
- Voice-line intake.
- Pixel-level object counting (e.g. "exactly 312 saplings"). SRC grades are rubric-level on purpose.

---

## Further Notes

### Evidence and calibration status
Evidence shown in a deployment may be live, seeded, or synthetic. Label it at the point of use and do not present seeded material as field capture. Do not claim a calibration holdout size, measured accuracy, or calibrated production performance unless the corresponding versioned evaluation artifact is available and its data source is clear.

### Demo requirements
Use the current [demo script](DEMO_SCRIPT.md) and judge entry page as the source of the reproducible sequence. The walkthrough must label service-dependent actions and any seeded evidence, and must not promise bulk throughput, Cloudinary AI add-ons, video reels, or other unimplemented capabilities.

### Account/service assumptions to recheck
- The checked-in Cloudinary probe records AI captioning, Google/AWS auto-tagging, Cloudinary tagging, and advanced OCR as unavailable on the account at probe time. Recheck before describing any such add-on as enabled.
- Jev availability, model/version, rate limits, and batching behavior depend on the configured service and should be reported from the running deployment.

### Sources consulted
- TypeSafe AI, *Introducing System One Models & Jev*: https://typesafe.ai/blog/introducing-system-one-models-and-jev
- Community project directory: https://madewithjev.com/
- awesome-jev (155+ projects, caveats on text-only input and confidence): https://github.com/cobanov/awesome-jev
- Cloudinary Agents launch (May 2026): https://www.businesswire.com/news/home/20260505410851/en/Cloudinary-Launches-AI-Agents-to-Streamline-Enterprise-Scale-Visual-Media-Management-and-Brand-Governance
