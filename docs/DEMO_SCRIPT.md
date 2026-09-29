# SAAKSHYA three-minute demo

This walkthrough focuses on one accepted before/after photo comparison: the image alignment, the visible-green-cover measurement, Jev's decision, and the stored decision receipt. Read live values from the page; they can change with the selected comparison.

## Before recording

- Make sure the app and its services are reachable. Check the service-health indicators before starting.
- Prepare one Plot B comparison whose follow-up is **Accepted**, whose registration is **Good**, and whose Jev grade has completed. Set the baseline and process the follow-up before recording so you do not have to upload or change sites mid-demo.
- Keep this pair's current displayed grade, alignment count, and cover percentages in view as you rehearse. Do not memorize benchmark values as if they were guaranteed live values.
- The reproducible photo benchmark lives in [`cv/benchmarks`](../cv/benchmarks/README.md) and uses the photos in `web/test-images/`.

## 0:00-0:25 | The problem

**Show:** SAAKSHYA's home page with the active monitoring sites.

**Say:** "Field teams send in lots of photos, but a photo on its own does not prove a project claim. SAAKSHYA keeps the evidence, checks that before and after photos show the same place, and records how each decision was made."

## 0:25-0:55 | Open one comparison

**Do:** Click **Reading**, then open **Plot B**. Select the timepoint with the accepted comparison. Show the baseline and current photo side by side.

**Say:** "Here is one accepted comparison. The left image is the baseline, and the right image is the follow-up. The accepted label tells us this item passed the current evidence checks; now we can inspect how the comparison was measured."

## 0:55-1:35 | Show what computer vision measured

**Do:** Point to the alignment label and measurement overlay beneath the photos.

**Say:** "The CV worker aligns the follow-up to the baseline. This registration quality and inlier count tell us how many image features support that alignment. Once the views are aligned, it estimates visible green cover before and after, and how much of the aligned area changed. These are measurements of pixels in the photos, not a biomass measurement or proof of ecological success."

Read the actual registration quality, inlier count, and percentages from the screen. Do not promise an exact inlier count or percentage in the narration.

## 1:35-2:15 | Show Jev's decision and its receipt

**Do:** Point to the Jev grade and confidence. Click **Why: receipts & inputs**.

**Say:** "OpenCV does the pixel-level alignment and calculates the image measurements. Jev does not inspect the image pixels: it receives structured inputs such as the photo captions, the alignment result, the measured cover values, and the time since baseline, then returns a typed grade. This receipt shows the exact inputs and question behind this decision, along with the model details and state hash."

Point to the grade, probability distribution, typed question, decision state, and state hash. Describe the decision shown; do not read an old example grade or confidence.

## 2:15-2:40 | Show the public record

**Do:** Open the site's public page, for example `/s/plot-b`, and point to the same timepoint in **Recorded observations**.

**Say:** "The public table now shows the actual before-to-after visible green-cover estimate from the CV worker, plus the share of the aligned view marked as changed. The note is explicit: this color-based estimate is not biomass."

## 2:40-3:00 | Be honest about service failures

If a service is down, show the live **Pending** state and its displayed reason. Say which step is waiting. If alignment is pending because the CV worker was unavailable, the evidence drawer has **Retry alignment**; use it only after CV is reachable. If it is still unavailable, leave the item pending. Do not present an old grade or measurement as current.

**Close:** "The photo comparison, the Jev decision, and its receipt stay connected, so reviewers can see both what was measured and what the model was asked to decide."

## Optional recorded backup

If you need a backup clip, start it with a visible title card: **Recorded walkthrough - captured YYYY-MM-DD - not live**. Say the capture date before showing the comparison. Keep the clip separate from the live product screen, and switch back to the live page for any current service status or current evidence state.

## Photo benchmark

The benchmark command, photo roles, environment versions, and measured results are documented in [`cv/benchmarks/README.md`](../cv/benchmarks/README.md) and [`photo-benchmark-results.json`](../cv/benchmarks/photo-benchmark-results.json). It runs the same registration and metric functions used by the CV worker on the existing demo photos. Use its results to rehearse, but read the current values on screen during a live recording.
