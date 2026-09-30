# SAAKSHYA judge walkthrough

Start from the [judge entry page](https://saakshya-web.vercel.app/judge). This sequence uses the normal upload, CV, Jev, witness, and report flows. The downloadable Plot B images and their chat dates are seeded repository fixtures, not field evidence.

## Before the walkthrough

- Open `/judge` and check its live service status. A service health response confirms reachability only; the resulting evidence and decision records determine whether a step completed.
- For a fresh repeat, use a clean or staging ledger with the Plot B site (`plot-b`). The app’s seeded Plot B files are also available at `web/test-images/baseline.jpg` and `followup.jpg`.
- Use a secure browser session with camera access for a live witness capture. Cloudinary, Jev, and the Python CV worker must be reachable for all steps to complete. The walkthrough leaves unavailable work pending.
- Uploads and witness submissions persist. Do not reset or delete records from a shared deployment. Repeat on a clean/staging ledger; duplicate checks may flag re-uploads.

## Ordered case

### 1. Upload the baseline — seeded input, live pipeline

**Open:** `/judge`, download **baseline ZIP · seeded fixture**, then follow **Open Intake**. It opens `/intake?siteId=plot-b`. Upload the ZIP through the regular Intake uploader. The archive contains one test photo and its matching chat date/comment.

**Do:** When ingest finishes, follow **Open comparison** to `/sites/plot-b`. On a clean ledger with no baseline, choose the uploaded item and click **Set as baseline**. The fixture is dated 2026-06-20, before Plot B's seeded claim period (2026-09-20 to 2026-10-11), so the normal integrity check may flag it as out of period. It remains selectable as a comparison baseline; call out the flag rather than describing it as within-period evidence.

**Say:** “This file is a seeded test image. It goes through the same signed upload and evidence-ingest path as an ordinary submission; its metadata does not make it field evidence.”

### 2. Upload the follow-up and inspect the comparison — seeded input, live processing

**Open:** `/judge` again, download **follow-up ZIP · seeded fixture**, then open Intake and upload it after the baseline is set. Return to `/sites/plot-b`.

**Show:** the baseline and follow-up, the alignment/registration result, and any measurements actually returned by the CV worker. Read the current values from the screen. If registration is still pending, open the evidence item’s drawer and retry after the worker is reachable; do not narrate a pending result as a measurement.

**Say:** “The Python/OpenCV worker aligns these two images and reports pixel-level differences. The values describe the images, not biomass or proof of ecological success.”

### 3. Open the saved Jev receipt — live record or pending

**Open:** `/judge` and use **Open receipt** for the latest aligned timepoint. The receipt page displays the stored decision, question, state, available probabilities, and model details. If no receipt exists yet, the page links back to the site state and labels the step pending.

**Say:** “This is the stored Jev decision record for the comparison. It shows what inputs and question were recorded; a missing or pending response remains pending.”

### 4. Submit witness evidence — live submission, optional seeded control

**Open:** `/w/plot-b`. Start the camera, take a photo, add an optional observation, and submit. Allow camera access. On completion, use **Open this evidence record** to return to the saved item in Intake; check its actual accepted, review, or pending state.

The optional `/w/plot-b?sample=seeded-followup` button re-uploads the follow-up fixture. It can trigger duplicate detection and is not independent testimony. Use it only as a clearly labeled seeded control when a live capture is unavailable.

**Say:** “A witness submission enters the evidence pipeline and its saved item can be inspected here. This control image is seeded and cannot stand in for an independent observation.”

### 5. Compose and inspect the checked report — live facts, seeded negative control

**Open:** `/judge` and use **Generate judge report**. It opens `/reports?judge=1&projectId=yamuna-green&periodStart=2026-06-01&periodEnd=2026-10-11`; choose **New Attributable Report** and generate the report. The judge option uses the normal composer and Jev sentence checks, and adds one visibly labeled, uncited test sentence: “Exactly 999 saplings survived the monsoon in Plot B.” The existing no-receipt rule marks that sentence struck; it is explicitly a test control, not a project claim.

**Show:** at least one live, cited sentence kept by Jev and the seeded uncited control struck. If there are no eligible facts, no supported sentence is kept, or Jev is unavailable, the page will show the actual pending/struck outcome. Do not present that run as a successful kept-plus-struck report. Return to the judge page after a successful report; it links directly to the saved report and reports the kept, struck, and pending counts.

**Say:** “The report composer checks drafted sentences against ledger facts. This kept sentence has a receipt; the seeded sentence has none, so it is struck. When a check cannot run, the report marks it pending.”

### 6. Play the video and build a campaign card — optional, live service results
Use a video you are permitted to share (the Cloudinary demo video is fine for a rehearsal). In Search, choose **Analyse public video**, enter the URL, a site, and a permission note, then open **Open video rubric** when the stream completes.

**Say:** "The video plays with the three sampled moments marked on its timeline. Clicking a moment, or its observation, jumps the video there, and the highlight follows playback. Each observation shows Jev's relevance decision with its probabilities and the review status. The video's date and location are not verified, and the page says so."

In Review, accept one or more frames, then return and choose **Generate campaign card**. Jev sees text, not pixels, and a video frame has no caption or tags, so its relevance call on a frame is usually low-confidence and is shown as advisory; the reviewer's acceptance is what decides. The card uses only reviewer-accepted frames, with faces pixelated and a footer that states the date and location are unverified. Each caption sentence cites ledger facts and shows whether Jev kept or struck it. If Jev is unavailable the sentences read **pending**; do not present them as approved.

## Status labels and recovery

- **Seeded** marks repository test media or the explicitly injected report control sentence.
- **Live** marks a current service response or saved ledger record. It does not certify that seeded media is a real field capture.
- **Pending** means required evidence or an external response is unavailable. Read the displayed reason and retry only when its dependency is reachable.
- If Cloudinary upload is unavailable, leave the upload pending/failed. If CV is unavailable, alignment stays pending. If Jev is unavailable, its decision stays pending. Do not replace current states with prepared screenshots or invented values.

## Local setup

For a disposable local run, follow the root README, clear `DATABASE_URL` in `web/.env` to use local PGlite, then run `npm install`, `npm run seed`, and `npm run dev` from `web/`. In a second terminal, run `pip install -e .` and `uvicorn app.main:app --port 8001` from `cv/`. Set the Cloudinary, Jev, Groq, and CV worker keys in `web/.env`. Do not point this demo at a shared production database. The judge page shows service checks and the saved state.
