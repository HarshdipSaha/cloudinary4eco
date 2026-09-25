# SAAKSHYA — Demo Video Script

A ~5-6 minute walkthrough proving the core promise: **a pile of unsorted field photos becomes a
receipt-linked donor report, with every claim traceable to its evidence.** Each section names
what to say and exactly what to click/open. Run through it once live before recording — a couple
of steps depend on real API calls (Cloudinary, Jev, the CV worker) taking a second or two.

Before recording: make sure `npm run dev` (web) and the CV worker (`uvicorn app.main:app`,
`cv/`) are both running, and the demo project/sites are seeded (`npm run seed` with the dev
server stopped, then restart it — see the note at the bottom on why order matters).

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
   — point out this is a real, metered AI call, not a canned demo number.
4. Point at the result grid: sender names and timestamps pulled straight out of the chat text
   (no EXIF needed), one photo already matched to a site with a confidence score, the others
   correctly left unassigned rather than guessed.

**Say:** "Nothing here is invented. If the model isn't confident, it says so and routes to a
human — it never silently guesses a site or a date."

---

## 3. Inspect one item — the receipts view (30s)

**Show:** Click the top photo (the one auto-matched to Plot B). Point out, top to bottom:
- **Cloudinary Perception** — real metadata read off the file (or an honest "not available" if
  an analysis add-on isn't licensed on this account — never a fabricated caption).
- **Calibrated Decisions (Jev)** — three separate typed decisions (site match, relevance,
  activity), each with a full probability distribution, not just a single guess.
- **Integrity & Quality Flags** — plain-language reasons for anything that needs a human look
  (no capture time, no GPS, date outside the claim period).

**Say:** "Every one of these numbers is a receipt. Nothing on this screen was made up by an LLM."

---

## 4. Human review with an audit trail (30s)

**Show:** Click **Accept** (or **Assign site**). Note the app **requires a typed reason** before
the action completes — type one, confirm.

**Say:** "Every human override is logged with a reason. That's the audit trail an auditor can
walk months later — who changed what, and why."

---

## 5. Baseline, registration, and grading — the real computer vision (60s)

**Say:** "This is the part that's usually manual and unreliable: is the after-photo actually the
same spot as the before-photo? We don't ask an LLM to eyeball that — we align it with real
computer vision."

**Show:**
1. Navigate to **Reading** → the site (Plot B). If no baseline is set yet, show the baseline
   picker and click **Set as baseline** on the accepted photo.
2. Assign a second photo (the follow-up) to the same site via **Review** (Reassign site).
3. Back on the site's Reading page, point at the result: **"REG GOOD · N pts"** (real homography
   inlier count from OpenCV), the **vegetation-change readout** (e.g. "VEG 12→38% · CHANGED
   36%"), and the **Jev grade** ("Partially established," with its probability).

**Say:** "Alignment quality, vegetation change, brightness shift — all deterministic OpenCV
measurements. Jev only grades once the numbers exist. If the CV worker or Jev is down, this
shows 'pending,' never a guessed grade — that's a hard product rule, not a fallback we forgot."

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
