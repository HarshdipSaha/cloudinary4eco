---
effort: 003
title: End-to-end validation with realistic datasets, plus two more bugs found live
type: validation + bug fixes (fix fast-path)
state: complete
---

## What was tested
Live, in-browser, via Playwright, against the real (non-mocked) Cloudinary, Jev, and CV worker
services — no fakes:
1. Direct multi-file upload (`test-images/baseline.jpg`, `followup.jpg`) — date-less, GPS-less,
   the case that motivated Effort 001.
2. Full WhatsApp export ZIP (`test-images/whatsapp_field_export.zip`: 3 photos + `_chat.txt`) —
   exercises unpack, chat-metadata parsing (sender + timestamp fallback), multi-photo batch
   triage, and a genuine `date_out_of_period` integrity flag (chat date predates the seeded
   claim's period start) — all correct, not a bug.
3. Full review loop: accept-with-reason, reassign-site-with-reason, both with mandatory audit
   trail text.
4. Baseline set → second photo assigned → **real CV registration** via the now-running CV
   worker (422 inlier points, "good" quality) → real OpenCV-computed vegetation-change metrics
   (12%→38%) → real Jev SRC grade (93% "Partially established").
5. Full report generation → Jev-verified sentence-level attribution, correctly keeping
   well-supported sentences and withholding unsupported ones.
(Mapillary, the dataset the user originally named, was not used — its API requires an OAuth
token not available in this environment. The WhatsApp export fixture already in the repo covers
the same ground — realistic multi-photo batches with metadata fallback — without that blocker.)

## Bugs found and fixed during this pass
1. **CV worker never started.** Not a code bug — it's a separate FastAPI/OpenCV deployable
   (`cv/`) that nothing had launched. Created `cv/.env` (`CLOUDINARY_URL`, `CV_WORKER_KEY`,
   matching the web app's key) and started it (`uvicorn app.main:app --env-file .env`).
2. **`GROQ_MODEL=llama-3.3-70b-versatile` no longer exists on Groq.** Queried the account's live
   model list, verified `openai/gpt-oss-120b` produces correctly-formatted drafts, and updated
   `.env.local`, `.env.example`, and the hardcoded fallback in `groq.ts`.
3. **Citation parser only recognized ASCII `[F1]` brackets.** The replacement model
   (a reasoning-tuned model, unlike the old one) sometimes emits full-width `【F1】` brackets;
   the regex found zero citations and withheld every sentence. Broadened `CITE` in
   `reports/sentences.ts` to accept both bracket styles (defense in depth — the actual fact-ID
   existence check is unchanged, so this doesn't weaken verification), added a regression test,
   and strengthened the system prompt to ask explicitly for ASCII brackets.
4. Removed two now-stale hardcoded "Llama 3.3 70B" UI strings (`NewReportForm.tsx`,
   `ReportSheet.tsx`) in favor of generic, durably-accurate labels — a hardcoded model name in a
   trust-critical "attributable integrity report" is itself a small trust bug waiting to recur on
   the next provider change.

## Verification
Full suite (27 files / 108 tests, 1 pre-existing skip) green; `tsc --noEmit` clean; every flow
above re-confirmed live in the browser after each fix, with zero console errors at any step.
