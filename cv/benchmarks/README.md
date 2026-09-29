# Photo registration benchmark

This small benchmark runs the production OpenCV registration and change-metric functions on the photo fixtures already used by the web demo. It checks one same-scene pair and one unrelated-photo negative control; it does not make a claim about real-world planting outcomes.

## Run it

From the repository root, install the CV package dependencies, then run:

```powershell
python cv/benchmarks/benchmark_photos.py --output cv/benchmarks/photo-benchmark-results.json
```

The benchmark reads these existing files without copying or modifying them:

- `web/test-images/baseline.jpg` — reference frame
- `web/test-images/followup.jpg` — same-scene comparison frame
- `web/test-images/other_site.jpg` — unrelated-photo negative control

The JSON output records OpenCV and NumPy versions, elapsed time, registration quality, inlier count and ratio, plus measured image metrics when alignment succeeds. Counts and fractions can vary slightly across OpenCV versions; compare the expected quality and the broad behavior rather than requiring an exact feature count.

`vegetation_fraction_before` and `vegetation_fraction_after` estimate the share of visible pixels classified as green inside the valid aligned area. They are image-color measurements, not biomass or proof of ecological change. `changed_area_fraction` measures the share of that area the image-difference routine marked as changed.

## Demo use

For a presentation, point to the positive pair's actual measured alignment and before/after visible-green-cover values. Then show the app's stored Jev grade decision and its receipt. Do not copy benchmark numbers into a live demo script as guaranteed values; read the current comparison on screen.
