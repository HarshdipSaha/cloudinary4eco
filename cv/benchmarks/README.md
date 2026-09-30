# Photo registration benchmark

This benchmark runs the production OpenCV registration and change-metric code over a pre-registered manifest ([`cases.json`](cases.json)) of <!-- claim:benchmark.cases -->28<!-- /claim --> cases: <!-- claim:benchmark.lighting_cases -->9<!-- /claim --> lighting cases, <!-- claim:benchmark.angle_cases -->11<!-- /claim --> camera-angle cases, <!-- claim:benchmark.unrelated_cases -->6<!-- /claim --> unrelated-site negative controls, a mirrored-copy manipulation, and the demo same-scene pair. Expectations were written before the run; gated expectations met: <!-- claim:benchmark.gated_met -->26/26<!-- /claim -->. Summary table: [`photo-benchmark-results.md`](photo-benchmark-results.md).

## What it supports

The registration step recognised the same scene under the tested lighting changes (gamma, contrast, colour cast, shadow, noise, heavy JPEG compression) and camera changes (rotation, distance, shift, tilt), and rejected every unrelated photo and the mirrored copy in this set. Where the true transform is known, the four image corners landed within <!-- claim:benchmark.angle_max_error_px -->0.23<!-- /claim --> px of their true positions in the worst angle case.

## What it does not support

- Most lighting and angle cases are synthetic perturbations of one demo photo, generated in memory. The recovered alignment is measured against the known transform, but the two images contain identical content, which is easier than a real re-shoot where plants have grown and light has changed. Only the four demo photos in `web/test-images/` are real images, and only three cases pair two different real photos of the same scene.
- Two exploratory stress cases (severe underexposure, a 35° rotation) are reported but not gated. Both registered successfully, so this set has not found where registration breaks.
- It says nothing about real-world planting outcomes, and it does not evaluate Jev. Jev's evaluation is in [`web/calibration`](../../web/calibration/README.md).

## Run it

From the repository root, install the CV package dependencies, then run:

```powershell
python cv/benchmarks/benchmark_photos.py --output cv/benchmarks/photo-benchmark-results.json
```

The command exits non-zero if any gated expectation is missed, and CI runs it on every push. The results file records the SHA-256 of `cases.json`; CI fails if the manifest changes without regenerating the results, so the published table always matches the cases that produced it. Counts can vary slightly across OpenCV versions, so expectations are on registration quality, not exact feature counts.

Synthetic perturbations (`perturb.py`) are deterministic and seeded. Photos are read from `web/test-images/` without being copied or modified:

- `baseline.jpg` — reference frame
- `followup.jpg` — same-scene comparison frame
- `other_site.jpg`, `desert_witness.jpg` — unrelated-photo negative controls

`vegetation_fraction_before` and `vegetation_fraction_after` estimate the share of visible pixels classified as green inside the valid aligned area. They are image-colour measurements, not biomass or proof of ecological change. `changed_area_fraction` measures the share of that area the image-difference routine marked as changed.

## Demo use

For a presentation, point to the positive pair's actual measured alignment and before/after visible-green-cover values. Then show the app's stored Jev grade decision and its receipt. Do not copy benchmark numbers into a live demo script as guaranteed values; read the current comparison on screen.
