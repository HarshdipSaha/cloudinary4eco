# Photo benchmark results

Generated 2026-09-30T17:22:39.348370+00:00 with OpenCV 4.10.0. Synthetic perturbations test robustness; they are not field photos.

| Category | Cases | Gated met | Qualities | Median corner error (px) | Max corner error (px) |
|---|---|---|---|---|---|
| angle | 11 | 10/10 | good 11 | 0.1 | 0.23 |
| lighting | 9 | 8/8 | good 9 | 0.01 | 0.23 |
| manipulated | 1 | 1/1 | failed 1 | — | — |
| same_scene | 1 | 1/1 | good 1 | — | — |
| unrelated_site | 6 | 6/6 | failed 6 | — | — |

## Not gated

- `lighting_dusk_gamma_4` (good): Severe underexposure; records where registration degrades.
- `angle_rotate_35` (good): Far outside how a QR-plaque re-shoot is framed.
