# Literature Scan → Spec/Plan Recommendations

> **Historical research notes, not an implementation guide.** Recommendations below may refer to earlier planning states. They do not describe shipped SAAKSHYA capabilities; check the [current specification](SPECIFICATION_DOCUMENT.md) and [verified Cloudinary integration guide](CLOUDINARY.md) for current behavior.

**Scope:** arXiv + web search pass against the current spec (`docs/SPECIFICATION_DOCUMENT.md`) and plan (`docs/superpowers/plans/2026-09-24-saakshya.md`), run 25 Sep 2026, against work completed through Task 19 (registration + change metrics in `cv/`).

**How to read this doc:** each section is one pipeline stage. Papers are listed with what they actually say, then an earlier recommendation graded **Do it**, **Consider**, or **Note only**. The current boundary is: Cloudinary handles media upload, available metadata, transformations and structured search; Python/OpenCV measures image registration and change; Jev returns typed decisions; Groq drafts report prose.

---

## 1. Registration (Task 18, already implemented as SIFT + MAGSAC)

Your `cv/app/register.py` uses classic SIFT + BFMatcher(ratio test) + `cv2.USAC_MAGSAC`. This is a defensible, explainable, dependency-light choice for a hackathon and it's already passing tests. The literature scan turned up the actual gap it has:

- **MAGSAC / MAGSAC++** — Barath et al., [MAGSAC (1803.07469)](https://arxiv.org/abs/1803.07469), [MAGSAC++ (1912.05909)](https://arxiv.org/abs/1912.05909). Confirms `USAC_MAGSAC` is the right robust estimator (no user-set inlier threshold, marginalizes over noise scale) — you're already using the state of the art here, nothing to change.
- **A Large-Scale Homography Benchmark ("HEB")** — [2302.09997](https://arxiv.org/abs/2302.09997). Useful as a citation for why homography (not just fundamental-matrix / essential-matrix) is the right model for near-planar, same-viewpoint site photography, and gives you off-the-shelf error metrics if a judge asks how you'd evaluate registration accuracy beyond inlier count.
- **LightGlue** — [2306.13643](https://arxiv.org/abs/2306.13643). A learned sparse matcher, faster and more accurate than SIFT+ratio-test, drop-in replacement for the matching step (keeps your MAGSAC homography stage unchanged).
- **RoMa / RoMa v2** — [2305.15404](https://arxiv.org/abs/2305.15404), [RoMa v2 2511.15706](https://arxiv.org/abs/2511.15706). Dense matching, explicitly built to be robust under **large appearance change** — different season, different lighting, months apart. This is exactly your `weak`/`failed` failure mode on real Delhi sites (dry season → post-monsoon, morning vs evening shadows on a construction site).

**Recommendation — Consider, not now:** Keep SIFT+MAGSAC as the shipped path (it's tested, it's explainable in the demo, "SIFT+MAGSAC" is a sentence a judge nods at). Add one line to Task 18's Step 5 real-photo check: if real same-site pairs separated by >2 weeks come back `weak`/`failed` more than you'd like, the fallback is LightGlue (still classical-looking, easy story: "we replaced hand-crafted descriptors with a learned matcher when seasonal light changed too much for SIFT"), not a full RoMa integration (dense matching is heavier, harder to explain live, and you don't have GPU headroom described anywhere in the plan). **Write this fallback into Task 18 as an explicit "if real-photo check fails, swap in LightGlue" escape hatch** rather than pre-building it — you don't know yet whether your actual Delhi photos need it.

**Do it now (cheap, no new dependency):** cite MAGSAC/MAGSAC++ by name with the arXiv link in the Report/Trust-panel "how this works" copy and in the pitch deck. It's a free credibility point — "we didn't invent robust estimation, we used the 2019 state of the art" is a stronger answer than silence when a judge who knows CV asks "why not RANSAC".

---

## 2. Change metrics / vegetation index (Task 19, already implemented as fixed-threshold ExG)

Your `cv/app/metrics.py` uses a fixed `EXG_THRESHOLD = 0.10` on the Excess Green index in Lab-space, plus a chroma+lightness change mask. The scan surfaced a specific, well-known weakness in exactly this design:

- **"Smartphone-based estimation of green cover depends on the camera used"** — Agronomy Journal, [acsess.onlinelibrary.wiley.com/doi/10.1002/agj2.20752](https://acsess.onlinelibrary.wiley.com/doi/10.1002/agj2.20752). Confirms that a fixed ExG threshold is camera- and lighting-sensitive — precisely the failure mode you're already guarding against with the `brightness_shift` metric, but the fix there is partial (it decorrelates *global* lightness shift, not per-pixel exposure variation across a scene with mixed sun/shade, which is common on Indian field sites at midday).
- **SATE — Saturation-Adaptive Threshold for ExG**, [ScienceDirect S0924271625003284](https://www.sciencedirect.com/science/article/abs/pii/S0924271625003284). Directly proposes an adaptive (not fixed) ExG threshold keyed to image saturation, aimed at exactly your use case (camera-based field FVC estimation). This is the closest thing in the literature to "here's how to fix the specific weakness in what you built."
- **Canopeo** (Agronomy/Extension tool, referenced across the above). A shipped, validated smartphone app using ExG + color-ratio thresholds for fractional green canopy cover — good prior art to cite as "this is a validated approach for exactly this measurement," since your rubric-grading story leans on "measured, not invented" numbers.
- **AnyChange / Segment Any Change** — [2402.01188](https://arxiv.org/abs/2402.01188), and the follow-up **"Towards Generalizable Scene Change Detection"** — [2409.06214](https://arxiv.org/abs/2409.06214) (reports in-domain-to-out-of-domain accuracy dropping from 77.6% to 8.0%, i.e. a strong warning that learned change-detection models trained on one dataset are brittle — reinforces your choice of a deterministic, non-learned metric).
- **Street Scene Change Detection (SSCD/DR-TANet, HPCFNet)** — [2103.00879](https://arxiv.org/abs/2103.00879), [2010.09925](https://arxiv.org/abs/2010.09925). This is the closest academic analogue to your "difference overlay" task: paired street-view images, same-ish viewpoint, detect changed regions. Confirms your two-stream (lightness + chroma) difference approach is methodologically standard; these papers' architectures are overkill for you but their **evaluation protocol** (precision/recall on a labelled changed-region mask) is worth stealing for the Calibration Harness if you want a second, geometry-level metric beyond SRC-grade accuracy.

**Recommendation — Do it now (one paragraph of code, not a new task):** In `change_metrics`, replace the fixed `EXG_THRESHOLD = 0.10` with an Otsu (or saturation-adaptive, per SATE) threshold computed per-image-pair rather than hardcoded, and keep `0.10` only as a floor/fallback when the histogram is degenerate (near-uniform scene). This is directly actionable inside the existing function signature, doesn't touch the test contract's *assertions* (they check direction and rough magnitude, not the literal constant), and closes a real, cited weakness before your real Delhi photos hit midday mixed-shade conditions. Tests to add: one synthetic case with a mixed-lighting patch (half the green patch in shadow) where the fixed threshold under-counts vegetation and the adaptive one doesn't.

**Note only:** AnyChange/learned change detection is explicitly *not* worth building — the generalization-drop evidence above is a good argument *for* your current deterministic-metrics decision if a judge asks "why not use a learned change detector?"

---

## 3. Recycled / duplicate image detection (Task 10, integrity checks — pHash Hamming distance)

Your `integrity.ts` flags `recycled_image`/`duplicate` purely on pHash Hamming distance (`THRESHOLDS.recycledHamming`). This is cheap and already Cloudinary-native (Cloudinary computes the pHash), which fits the division-of-labor rule. The scan found the actual academic framing of this exact task and its known weak point:

- **SSCD — "A Self-Supervised Descriptor for Image Copy Detection"** (Meta/Facebook) — [2202.10261](https://arxiv.org/abs/2202.10261). This is literally the "is this the same real-world image, possibly cropped/filtered/re-encoded" task — the DISC21 copy-detection benchmark this paper targets is closer to your fraud scenario ("same real image reused across claims" from your own spec's SAAKSHI callback) than raw pHash, which is known to be fragile to moderate crops, rotation, or aspect-ratio changes (all trivial for someone re-submitting a photo from a different phone or a screenshot).
- **"Double Down on Defense: Strengthening Deep Perceptual Hashes against Evasion Attacks"** — [2608.03101](https://arxiv.org/abs/2608.03101), Sep 2026. Confirms pHash-style hashes have known evasion attacks (adversarial perturbation, aggressive crop/recolor) — relevant to your threat model since a dishonest implementer resubmitting a doctored old photo is exactly the adversary SAAKSHYA is designed to catch.
- **"State of the Art: Image Hashing"** — [2108.11794](https://arxiv.org/abs/2108.11794), a useful survey citation if you want one line in the Trust panel explaining the recycled-image check's known limits.

**Recommendation — Note only, correctly out of scope:** Building or hosting an SSCD embedding model is real infra (a model server, GPU-friendlier than your CPU-only CV worker, a vector index) that doesn't fit a hackathon timeline and isn't what Cloudinary gives you for free. **The right move is not to build this — it's to say it out loud in the spec's "Out of Scope" or "Verify before building" section as a named, cited limitation**: *"Recycled-image detection uses Cloudinary's perceptual hash (Hamming distance), which is fast and free but known to miss moderate crops/recolors/aggressive JPEG re-encodes (cite SSCD, cite the evasion-defense paper); a production version would add a learned copy-detection descriptor."* This is a one-sentence addition to the plan's existing "Verify before building" / integrity section that upgrades a judge's read of your rigor without costing you an hour of build time. **Do it now.**

---

## 4. Sentence-level claim checking (Task 25, Report Composer — Jev `Noul` per sentence)

This is the part of your design closest to an active NLP research area, and it's good news: your design already matches the state of the art's shape (decompose into atomic claims, check each against cited-only evidence).

- **FActScore** — [2305.14251](https://arxiv.org/abs/2305.14251). Exactly your design pattern: split long-form generated text into atomic facts, score each against a knowledge source independently. Your `splitDraft` → per-sentence Jev `Noul` is a direct structural match; citing FActScore by name is the correct academic anchor for your Sentence Checker.
- **AlignScore** — [2305.16739](https://arxiv.org/abs/2305.16739). "Evaluating Factual Consistency with a Unified Alignment Function" — the general framing of "is generated text X consistent with source text Y" that your sentence-checker specializes to "is this sentence supported by *only its cited* evidence." Worth citing to explain *why* you scope each check to the cited evidence set rather than the whole ledger (this is the harder, more honest version of the alignment problem — most alignment-scoring work checks against the *entire* source, which would let an LLM cherry-pick support from unrelated facts).
- **"Measuring Attribution in Natural Language Generation Models"** — Rashkin et al., [2112.12870](https://arxiv.org/abs/2112.12870) (Google, the paper that introduced the AIS — Attributable to Identified Sources — framework most production citation-checkers descend from). This is the right paper to cite for the *concept* of "every sentence must be attributable to a specific, identified source," which is precisely your Report Composer's contract.

**Recommendation — Do it now, doc-only:** Add a two-sentence citation to the Report Composer section of the spec (§ "Report Composer" under Modules): *"The sentence-level support check follows the atomic-fact decomposition of FActScore (Min et al. 2023) and the attributable-to-identified-sources framing of Rashkin et al. 2021, specialized to check each sentence only against its own cited evidence rather than the full ledger."* This costs nothing, directly answers "isn't this just an LLM fact-checking an LLM" (no — it's citation-scoped Jev `Noul`, which is the harder and more defensible version), and shows the judges you know the adjacent research, not just the Jev SDK docs.

**Consider, low priority:** If you have spare time after Task 25 passes, add one *aggregate* metric to the Trust panel — "% of drafted sentences kept" and "% struck" per report — since FActScore-style work reports exactly this number as their headline metric. You likely already have the data in `report_sentences`; it's a query, not new infrastructure.

---

## 5. Calibration Harness (Task in Phase 4/6, ECE/Brier score on a labelled holdout)

- **"Information-theoretic Generalization Analysis for Expected Calibration Error"** — [2405.15709](https://arxiv.org/abs/2405.15709). The relevant fact for you: **binned ECE has a known, non-trivial estimation bias, especially on small holdouts** — and your plan's holdout is ~150 hand-labelled photos, which is small. On a set that size, naive 10-bin ECE can be noisy/biased enough to mislead the review-threshold tuning the plan says it's used for.
- **"A Consistent and Differentiable Lp Canonical Calibration Error Estimator"** — [2210.07810](https://arxiv.org/abs/2210.07810). One alternative estimator if you want to hedge against the above.

**Recommendation — Do it now, cheap:** In the Calibration Harness section, **report ECE with a stated bin count and an explicit caveat given the holdout size** (e.g. "ECE computed with 10 equal-width bins on n≈150; treat as indicative, not a precise estimate — standard binned ECE has known small-sample bias [cite 2405.15709]"). This is a one-line addition that preempts the single sharpest question a technically literate judge can ask about your Trust panel ("how confident are you in that confidence number, on 150 examples?") — and answering it with a citation instead of hand-waving is exactly the "founder fit / know your domain" signal your spec's "why this wins" section is going for.

**Consider, if time allows:** compute Brier score alongside ECE (the plan already lists Brier score as a target metric) since Brier doesn't have the same binning-bias problem and gives you a second, more defensible number to put next to ECE on the small holdout.

---

## 6. Witness reliability / crowd aggregation (Witness Channel, Task 24 — witness agreement)

Your spec currently treats every witness submission as an equal, single input into the `corroborates`/`contradicts`/`insufficient` Jev call. The scan surfaced the classic framing of "many possibly-unreliable anonymous contributors, one ground truth":

- **Dawid–Skene model** — background confirmed via [1605.07696](https://arxiv.org/abs/1605.07696) ("Exact Exponent in Optimal Rates for Crowdsourcing"), the canonical reference for aggregating labels from workers of unknown, heterogeneous reliability without ground truth.
- **"Can the Crowd Judge Truthfulness? A Longitudinal Study on Recent Misinformation"** — [2107.11755](https://arxiv.org/abs/2107.11755). Directly on-topic: non-expert crowds assessing truthfulness of claims, which is structurally your anonymous-witness-vs-implementer-claim setup.

**Recommendation — Note only, correctly out of scope for the hackathon:** A full Dawid-Skene EM reliability model per anonymous, one-shot, no-login witness is not viable (you have no repeat-witness identity to estimate reliability *from* — the QR flow is explicitly anonymous, no-login, per your spec). **Don't build this.** But it is worth one sentence in "Out of Scope" or the Witness Channel module description acknowledging the simplification: *"Witness agreement currently treats each submission independently via a single Jev `Choice`; it does not weight witnesses by track record (no login → no persistent witness identity to build one from). A Dawid-Skene-style reliability model becomes viable if witness accounts are added post-hackathon."* This turns a real limitation into a stated, cited design decision instead of a gap a judge finds on their own.

---

## 7. Prior art / positioning (not for the spec's engineering — for the pitch)

- **Government geotagged-photo M&E systems** (PM Awas Yojana and similar schemes, per [EDVIDA](https://edvida.in/blog/geotag-photos-ngo-government-field-work-india), [PRDP](https://prdp.da.gov.ph/how-to-guide-prdp-geo-tagging-camera-android-apps/)) already enforce **camera-in-app-only capture** (block gallery uploads), **non-editable GPS + server-side timestamp**, and basic duplicate-image detection as fund-release gates. This is good validation that your integrity-check list (GPS radius, date window, pHash dedup) targets the *actual* fraud patterns real deployed systems fight, not hypothetical ones — cite this as "prior art we're improving on" in the pitch.
  - **One concrete gap versus this prior art, worth fixing before demo day:** these production systems enforce camera-in-app-only capture to prevent gallery-upload spoofing of GPS/EXIF. Your spec's Witness Capture flow (Task "public QR page with ghost-overlay camera") should explicitly disallow picking an existing photo from the gallery on the public witness page — worth a one-line addition to the relevant user story/testing-decisions section if it isn't already implied. **Do it now (spec wording only)** — check Task for the capture surface and add "camera capture only, no file picker, on the public witness page" as an explicit acceptance criterion if it's currently just implied by "capture page."
- **Cloudinary's Analyze API (Beta)** — [documentation](https://cloudinary.com/documentation/analyze_api_guide) describes free-form image questions. This is a research reference, not an integrated SAAKSHYA capability. The current adapter parses optional caption/OCR response fields, while the checked-in account probe records the related Cloudinary AI add-ons as unavailable. If availability changes, evaluate the feature, its cost, and its returned fields before proposing an integration; Jev and the current evidence pipeline remain unchanged today.
- **Jev SDK / API confirmed current** — [docs.typesafe.ai/concepts/system-one](https://docs.typesafe.ai/concepts/system-one), [typesafe.ai/blog/introducing-system-one-models-and-jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev). The plan's §0.4 "Verified external API facts" table matches what's publicly documented (Choice/Score/Noul, $0.042/MTok input, free output, cardinality ≤255). No changes needed; the plan's homework here was already correct.

---

## Summary table

| # | Area | Action | Effort | When |
|---|---|---|---|---|
| 1 | Registration | Cite MAGSAC/MAGSAC++ in Trust panel copy; write LightGlue as an explicit fallback trigger condition in Task 18 (don't build unless real photos need it) | ~10 min doc | Now |
| 2 | Vegetation/change metric | Replace fixed `EXG_THRESHOLD` with Otsu/saturation-adaptive threshold (per SATE), add a mixed-lighting test case | ~30–60 min code+test | Before Task 20 locks the worker API |
| 3 | Recycled-image detection | Add a named, cited limitation sentence (pHash is crop/recolor-fragile per SSCD/evasion papers) to spec's integrity-check description | ~5 min doc | Now |
| 4 | Sentence checker | Cite FActScore + AlignScore + Rashkin AIS framing in the Report Composer spec section | ~10 min doc | Now |
| 5 | Calibration Harness | State bin count + small-sample ECE caveat with citation; add Brier alongside ECE | ~15 min doc + already-planned Brier | Now / Task for Calibration Harness |
| 6 | Witness agreement | Add a named "no persistent witness identity → no reliability weighting" limitation to Out of Scope | ~5 min doc | Now |
| 7a | Witness Capture | Add explicit "camera-only, no gallery picker" acceptance criterion | ~5 min doc | Now |
| 7b | Cloudinary Analyze API | Check availability/quota during Task 3's probe; if available, consider feeding one extra Analyze-API answer into the SRC-grade state | ~0 extra (piggybacks on Task 3) | Task 3 |

Nothing here proposes changing the Jev-decides / Cloudinary-perceives / deterministic-code-measures boundary, the module list, or the surfaces. It's citations that strengthen answers you'll be asked live, one real code fix (#2, cheap and inside the already-open `metrics.py`), and explicit, cited framing of two things you were always going to leave out of scope (#3, #6) so they read as decisions instead of gaps.

---

### Sources consulted (in addition to arXiv)
- Cloudinary Analyze API (Beta) docs: https://cloudinary.com/documentation/analyze_api_guide
- Cloudinary AI Content Analysis (captioning/tagging): https://cloudinary.com/documentation/cloudinary_ai_content_analysis_automatic_tagging
- TypeSafe AI System One / Jev docs: https://docs.typesafe.ai/concepts/system-one
- TypeSafe AI launch post: https://typesafe.ai/blog/introducing-system-one-models-and-jev
- Geotagged-photo M&E prior art: https://edvida.in/blog/geotag-photos-ngo-government-field-work-india, https://prdp.da.gov.ph/how-to-guide-prdp-geo-tagging-camera-android-apps/
- Smartphone ExG camera-dependence: https://acsess.onlinelibrary.wiley.com/doi/10.1002/agj2.20752
- SATE adaptive ExG threshold: https://www.sciencedirect.com/science/article/abs/pii/S0924271625003284
