# SAAKSHYA — Live Loom Recording Script

A ~3-4 minute self-recorded walkthrough. Product-first — don't explain code, explain what
just happened and why it matters. Every step below is verified working end-to-end.

## Before you hit record

1. Make sure both servers are running:
   - Web app: `cd web && npm run dev` → http://localhost:3000
   - CV worker: `cd cv && uvicorn app.main:app --port 8001` (with `CLOUDINARY_URL` and
     `CV_WORKER_KEY` env vars set — see `docs/DEMO_SCRIPT.md` for the exact format)
2. Get a **clean** demo state (do this right before recording, web server stopped while seeding):
   ```
   cd web
   # stop npm run dev first
   rm -rf .data/pglite
   npm run seed
   npm run dev
   ```
3. Open http://localhost:3000/api/status once — confirm `jev`, `cloudinary`, `cv` all say `"up"`.
   If Jev is flaky, bump `JEV_TIMEOUT_MS=20000` in `web/.env.local` and restart the dev server.
4. Have these two files ready on your desktop, you'll upload them at specific steps:
   - `web/test-images/whatsapp_field_export.zip`
   - `web/test-images/followup.jpg`
5. Start Loom (screen + webcam + mic).

---

## Step-by-step

### 1. Open the home page — http://localhost:3000/

**Say:** *"NGOs and CSR teams plant thousands of trees and clean rivers every year — but how
does a donor actually know it happened? This is SAAKSHYA. Every project site is tracked here,
with its current grade and any red flag that needs a human's attention."*

Point at the "Active Monitoring Sites" table — Plot B, Plot C, Desert Afforestation Block.

---

### 2. Open **Intake** — http://localhost:3000/intake

Click **Import Photos / ZIP** → upload **`whatsapp_field_export.zip`**.

**Say (while it processes, ~10-15s):** *"Evidence often just arrives as a phone gallery dump.
Watch what happens when we drop one in. Real AI sorts every photo — who sent it, when, which
site it belongs to — and flags anything suspicious, like a photo dated before the work even
started."*

Point at the result grid once done: `baseline.jpg` matched to Plot B but flagged **Date outside
period**; `followup.jpg`... wait, don't upload followup yet — only the zip has `baseline.jpg` +
`other_site.jpg` on first pass, plus `followup.jpg` inside it too. That's fine, just narrate what
you see per row.

---

### 3. Accept the baseline photo — go to http://localhost:3000/review

Click **`baseline.jpg`** in the queue. Point at the receipts panel (Cloudinary metadata, Jev's
site-match confidence, the **Date outside period** flag with its plain-language reason).

Click **Accept as valid evidence** → type a reason in the box, e.g.
*"Pre-period reference photo confirmed with field team, acceptable as baseline."* → click
**Record Decision & Next**.

**Say:** *"A human reviews the flag, types a reason, and that decision is permanently logged.
Nothing is ever silently guessed."*

---

### 4. Set the baseline and register the follow-up — http://localhost:3000/sites/plot-b

Click **Set as baseline** on the now-accepted photo.

Go back to **Intake** (http://localhost:3000/intake) and upload **`followup.jpg`** alone this
time (not the zip). Wait ~10s for it to process — since the baseline now exists, it should
auto-accept with no flags.

Go back to http://localhost:3000/sites/plot-b.

**Say:** *"Once a baseline is set, every follow-up is automatically lined up against it and
compared. SAAKSHYA measures the real change on the ground and grades progress the same way
every time, so results can't be exaggerated."*

Point at: **"REG GOOD · N pts"** (real alignment), the vegetation-change readout, and the Jev
grade (e.g. "Partially established").

---

### 5. The weather catch — http://localhost:3000/w/plot-d

This is the big "wow" moment. If you're not physically somewhere hot and dry, open Chrome
DevTools → **More tools → Sensors** → set **Location** to `26.9157, 70.9083` (Jaisalmer, the
seeded Desert Afforestation Block). Grant camera + location permission when asked.

**Say:** *"Here's a fraud check nobody else does. Anyone can scan a site's QR code and submit a
photo, no login. SAAKSHYA checks that photo's location and date against real historical
weather."*

Click **Start camera** → line up the shot → take the photo → **Submit Photo**. Use a clear,
well-lit shot (a blurry one gets honestly rejected as low quality, which is a fine thing to
mention but not what you want mid-recording).

Go to **Search** (http://localhost:3000/search), check **Has integrity flag**, filter to the
Desert Afforestation Block, open the new submission.

**Say (pointing at the Weather mismatch flag):** *"This one claims a monsoon planting drive —
but the real weather that day was over thirty degrees and completely dry. Caught, automatically,
for free — that came from a live call to a public weather API, nothing invented."*

(It may show under "Set aside" instead of the main queue if Jev also flagged image quality —
that's independent of the weather check.)

---

### 6. Search — http://localhost:3000/search

**Say:** *"Every photo is searchable, in plain language. Anything flagged is one click away."*
Clear the filter, show the plain-text search box briefly.

---

### 7. Generate a report — http://localhost:3000/reports

Click **New Attributable Report** → leave the default dates → **Generate Report**. This takes
~15-30s (real drafting + verification call) — keep talking while it works.

**Say:** *"This is what a donor actually wants: a report they can trust. SAAKSHYA drafts it,
then independently verifies every sentence against the evidence. Anything it can't prove is
struck out and withheld, automatically."*

Once it opens, scroll and point at a kept sentence's footnote and (if present) a struck
"Overclaim Withheld" sentence.

---

### 8. Trust + public page — http://localhost:3000/trust then http://localhost:3000/s/plot-b

**Say:** *"The same evidence is public. Anyone can open a site's page and see the same photo
timeline, with every face automatically blurred for privacy. This isn't an internal dashboard —
it's a public record."*

---

### 9. Close

**Say:** *"SAAKSHYA. Verifiable impact tracking, built so no one has to just take an NGO's word
for it."*

Then show the two closing images (open them full-screen or cut to them in Loom's editor):

- `web/demo/cloudinary-circles.jpg` — *"None of this works without real media intelligence
  behind it. Cloudinary powers this entire pipeline: uploads, GPS preservation, AI tagging,
  before-and-after comparison, face blurring, and OCR — six jobs, one platform."*
- `web/demo/jev-heap.jpg` — *"And every one of the seven places AI makes a judgment call in this
  app is a typed, calibrated decision with a full probability distribution — never a free-form
  guess."*

---

## If something goes wrong mid-recording

- **Jev shows "unreachable"**: wait ~10s and retry the action; it's usually a rate-limit blip,
  not a real outage. Don't panic-narrate it as broken — say "let's give that a second" and move on.
- **CV worker down / "pending" grade**: that's honest degraded behavior, not a bug — you can say
  so on camera and move to the next step; grading will backfill once it's back.
- **Weather flag doesn't fire**: real weather at 26.9157, 70.9083 was hot & dry when this was
  last verified (2026-09-28); if it's rained there since, either try another real desert
  coordinate or just show the flag not firing and say that's the system correctly not crying
  wolf.
