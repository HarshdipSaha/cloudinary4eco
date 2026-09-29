# Production evidence proof — 2026-09-29

The non-destructive Playwright proof ran against `https://saakshya-web.vercel.app` on 2026-09-29 and passed.

- Deployment commit: `5b60d2c21dc2ba29f5fc430f30d38ff1be243343`
- Proof command: `PRODUCTION_PROOF=1 npm run proof:production`
- QR: the plaque `data-witness-url` and visible witness link both resolved to `https://saakshya-web.vercel.app/w/plot-d`; decoding the rendered QR pixels returned that exact URL.
- Mobile witness: the page exposed the explicit `Take photo with camera` fallback. The headless browser reported `NotSupportedError` for `getUserMedia`, so no evidence was submitted.
- Photo fixtures: baseline `saakshya/yamuna-green/bulk_import/oq37pbmld79uieofyemp` and follow-up `saakshya/yamuna-green/bulk_import/cqd1wbckabciswig1voo` both belonged to `plot-b` and were `accepted`. The baseline retained its visible `date_out_of_period` flag; the follow-up had no flags. Intake, Reading, Review, and Search surfaces rendered the configured evidence.
- Public video: import `pvi_HzGnFwYbJ0fI` used the permitted Cloudinary demo URL and produced exactly three frames at `1.341s`, `6.707s`, and `12.072s`. All three shared the import ID and source URL, were `needs_review`, and retained `gps` and `capture_time` as missing signals. The opened receipt displayed the limitation that capture time and GPS are unavailable unless separately verified.

The full JSON result and screenshots are generated under the ignored local directory `web/artifacts/production-evidence-proof/`.
