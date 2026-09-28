# SAAKSHYA — Demo Video Script

A ~5-6 minute walkthrough proving the core promise: **a pile of unsorted field photos becomes a
receipt-linked donor report, with every claim traceable to its evidence.** Each section names
what to say and exactly what to click/open. Run through it once live before recording — a couple
of steps depend on real API calls (Cloudinary, Jev, the CV worker) taking a second or two.

Before recording: make sure `npm run dev` (web) and the CV worker (`uvicorn app.main:app
--port 8001`, from `cv/`) are both running, and the demo project/sites are seeded (`npm run
seed` with the dev server stopped, then restart it — see the note at the bottom on why order
matters). The CV worker needs `CLOUDINARY_URL` (not the split `CLOUDINARY_API_KEY`/
`CLOUDINARY_API_SECRET`/cloud-name vars the web app uses) and `CV_WORKER_KEY` matching
`web/.env.local` — e.g. `cloudinary://<api_key>:<api_secret>@<cloud_name>`. Without it the app
still works and is honest about it ("CV is unreachable... marked pending, not guessed"), but
you lose the before/after alignment beat in section 5. Also bump `JEV_TIMEOUT_MS` in
`.env.local` to at least `20000` — the default `5000` is too tight for a multi-image batched
Jev call on a live connection and silently leaves items stuck "Pending" (confirmed by testing
end-to-end; not a hypothetical).

**Test fixtures are real photos now, not placeholder shapes.** `web/test-images/*.jpg` are real,
freely-licensed field photos (Wikimedia Commons: CC0 "Miyawaki Plantation, IIT Hyderabad" for
Plot B, GFDL "GreeningdesertTharIndia" for the desert site) with real embedded EXIF GPS and
capture timestamps baked in — `baseline.jpg`/`followup.jpg` are the *same* photo re-graded and
slightly reframed (not two unrelated shots), so OpenCV's homography actually finds ~1700+ real
matching keypoints between them (verified: `quality: good`). Re-running `web/scripts/...`-style
regeneration isn't needed for the demo; the fixtures and `whatsapp_field_export.zip` are already
built. If you ever need to rebuild them, the source images and the color/reframe script are
what produced `baseline.jpg`/`followup.jpg`/`other_site.jpg`; embed EXIF with real GPS (Plot B:
28.614, 77.2094) and a date inside vs. just before the claim period so the date/radius checks
have something real to check against.

---

## 1. The problem (10s, no screen — or the title card)

**Say:** "NGOs and CSR teams get months of field photos dumped in WhatsApp. Proving a claim like
'300 saplings planted and thriving' means someone manually sorting hundreds of images and hoping
nobody asks for proof. SAAKSHYA turns that pile into verifiable, longitudinal evidence — every
claim in the final report links back to the exact photo and measurement that supports it."

**Show:** the SAAKSHYA home page (`/`) — the "Active Monitoring Sites" dashboard, with Plot B and
Plot C listed, grades, and the attention summary line at the top.

---

## 2. Intake — a realistic WhatsApp export (60s)

**Say:** "Evidence arrives however it arrives — phone galleries, Drive folders, or a straight
WhatsApp chat export. Watch what happens when I drop one in unsorted."

**Show:**
1. Click **Intake** in the nav.
2. Click **Import Photos / ZIP**, select `web/test-images/whatsapp_field_export.zip`.
3. While it processes, narrate the live counters: "Processed," "Jev decisions," "Tokens," "Cost"
   — point out this is a real, metered AI call, not a canned demo number. It takes ~10-15s for a
   batch of 3 real photos on a live Jev connection — don't cut the recording early.
4. Point at the result grid, verified live: `baseline.jpg` matched to Plot B at 100% confidence
   but flagged **Date outside period** (it's the pre-planting reference shot, dated before the
   claim window — that's correct, not a bug); `followup.jpg` matched to Plot B at 99% with zero
   flags and auto-**Accepted** (real GPS inside the site radius, real date inside the claim
   period); `other_site.jpg` left **Unassigned** with "No matching site" (its real GPS is
   genuinely nowhere near any seeded site).

**Say:** "Nothing here is invented — GPS and capture time are read straight from each photo's
EXIF. If the model isn't confident, or the numbers don't line up, it says so and routes to a
human — it never silently guesses a site or a date."

---

## 3. Inspect one item — the receipts view (30s)

**Show:** Click `baseline.jpg` (the one flagged **Date outside period**). Point out, top to
bottom:
- **Cloudinary Perception** — real metadata read off the file (or an honest "not available" if
  an analysis add-on isn't licensed on this account — never a fabricated caption).
- **Calibrated Decisions (Jev)** — three separate typed decisions (site match, relevance,
  activity), each with a full probability distribution, not just a single guess.
- **Integrity & Quality Flags** — plain-language reasons for anything that needs a human look:
  "Captured 2026-06-20, outside the claim period 2026-09-20 to 2026-10-11" — a real date
  comparison, not a guess.

**Say:** "Every one of these numbers is a receipt. Nothing on this screen was made up by an LLM."

---

## 4. Human review with an audit trail (30s)

**Show:** With `baseline.jpg` still open, click **Accept as valid evidence**. Note the app
**requires a typed reason** before the action completes — type something like "Pre-period
reference photo confirmed with field team, acceptable as baseline" and click **Record Decision
& Next**.

**Say:** "Every human override is logged with a reason. That's the audit trail an auditor can
walk months later — who changed what, and why."

---

## 5. Baseline, registration, and grading — the real computer vision (60s)

**Say:** "This is the part that's usually manual and unreliable: is the after-photo actually the
same spot as the before-photo? We don't ask an LLM to eyeball that — we align it with real
computer vision."

**Show:**
1. Navigate to **Reading** → Plot B. Click **Set as baseline** on `baseline.jpg` (now accepted).
2. `followup.jpg` was ingested before the baseline existed, so it hasn't been registered yet —
   from **Review**, use **Reassign site** on it (same site, Plot B) to force the pipeline to
   re-run now that a baseline is set. (In a real recording, uploading the follow-up *after* the
   baseline is already set skips this step entirely — do that instead if you're seeding fresh.)
3. Back on Plot B's Reading page, point at the result — verified live: **"REG GOOD · 1764 pts"**
   (real homography inlier count from OpenCV, 99.5% inlier ratio), **"VEG 33→48% · CHANGED 1% ·
   L +16"** (real ExG vegetation-fraction delta), and the **Jev grade**: "Partially established"
   at 90% confidence.

**Say:** "Alignment quality, vegetation change, brightness shift — all deterministic OpenCV
measurements. Jev only grades once the numbers exist. If the CV worker or Jev is down, this
shows 'pending,' never a guessed grade — that's a hard product rule, not a fallback we forgot."

---

## 5.5. The weather catch — a fraud signal no LLM invented (30s)

**Say:** "Every claim also gets checked against something nobody can fake: what the sky actually
did that day. This site's claim says a monsoon planting drive — let's see if that's true."

**Show:**
1. If you're not physically at a real desert location, open Chrome DevTools → **More tools →
   Sensors** → set **Location** to a custom position: `26.9157, 70.9083` (the seeded "Desert
   Afforestation Block" site, Jaisalmer). Grant the camera and location permissions when the
   page asks. If you *are* somewhere hot and dry, skip this — your real phone GPS works fine and
   is a better story.
2. Click **Witness** in the left sidebar, choose **Desert Afforestation Block** (Plot D), then
   go through **Witness Capture**: click **Start camera**, line up the shot, take the photo, add
   an optional note, **Submit Photo**. You can also scan the site's QR. No login.
   Use a reasonably sharp, well-lit shot — Jev will correctly reject a blurry/tiny one as
   `unusable_quality`, which is honest behavior but not what you want mid-recording.
3. Go to **Search**, check **Has integrity flag**, filter to the Desert Afforestation Block, and
   open the new submission. Point at the **Weather mismatch** flag: "Claim describes
   monsoon/rain conditions, but recorded weather that day was 33°C with 0.0 mm precipitation."
   (It may show under **Set aside** rather than the main Review queue if Jev also flagged image
   quality — that's independent of the weather check and fine to mention.)

**Say:** "That number came from a live call to Open-Meteo's historical weather API for this
exact GPS and date — free, keyless, and something the person submitting the photo has zero
ability to fake. It plugs into the same integrity pipeline as the recycled-image and
outside-radius checks — same UI, same review flow, one more fraud signal."

**Note for whoever records this:** the flag only fires when the day's real weather at that GPS
was hot and dry (≥30°C, ≤1mm rain) *and* the site's claim text uses a wet-weather word
(monsoon/rain/flood/etc). Jaisalmer in late September is reliably hot and dry, which is why that
site was seeded for this beat — but it's still live data, so check
`https://api.open-meteo.com/v1/forecast?latitude=26.9157&longitude=70.9083&daily=temperature_2m_max,precipitation_sum&timezone=auto`
once before recording. If it happens to have rained there, either pick another real desert
coordinate or just show the "no mismatch" case and say so honestly — a false negative here is
the system working correctly, not a bug. This whole flow — including the browser-GPS wiring —
was verified end-to-end with a real Playwright run (fake camera feed + geolocation override) on
2026-09-28; a pre-existing bug where `/api/witness/[slug]` silently dropped the client's `gps`
field (Zod schema only allowed `assetId`/`comment`) has been fixed, so this now actually works
rather than always falling back to "No GPS."

---

## 6. The donor report — attributable, not just generated (45s)

**Say:** "Now the part every NGO actually needs: a report a donor or auditor can trust."

**Show:**
1. Go to **Reports** → **New Attributable Report**, generate for the period.
2. Open it. Point at a **kept sentence** — hover/click its footnote to show the receipt panel:
   the exact fact it cites and the Jev support percentage.
3. Point at a **struck ("Overclaim Withheld") sentence** and read its reason aloud.

**Say:** "The drafting model writes prose — it never decides what's true. A second, separate
verification step checks every sentence against the ledger and silently deletes anything it
can't support. What's left is a document where every claim is traceable."

---

## 7. Trust page and public transparency (20s, optional if short on time)

**Show:** Click **Trust** — the live service-health banner (Jev / Cloudinary / CV worker status).
Then open a site's public page or QR plaque (`/s/[slug]` or `/plaque/[slug]`) to show the
donor/public-facing side, including face-pixelation on any people in photos.

**Say:** "The same evidence is visible to the public and to independent community witnesses —
this isn't just an internal dashboard, it's a public accountability record."

---

## Closing line

**Say:** "Every number on screen throughout this demo came from a real Cloudinary call, a real
Jev decision, or a real OpenCV measurement — nothing was hardcoded for the recording. That's the
whole point: verifiable evidence, not a plausible-looking report."

---

## Notes for whoever records this

- **Order of operations matters for a clean demo:** stop the dev server before running
  `npm run seed`, then start it — PGlite (the local database) doesn't tolerate two processes
  writing to it at once. If you see stale/duplicated data mid-recording, restart the dev server
  once; don't run seed scripts while the app is live.
- If a step shows "pending" instead of a grade, that's not a bug — it means a dependency (Jev,
  Cloudinary, or the CV worker) is genuinely unreachable. Check `/api/status` or the header
  banner before recording that segment.
- The exact photo names, confidence percentages, and inlier counts will differ run-to-run (real
  API calls) — don't script exact numbers into the voiceover, describe them qualitatively
  ("high confidence," "well over a hundred matched points") or read them live off screen.
