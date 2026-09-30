# Corpus change log

Changes to `cases.jsonl` made after the first live Jev run. Labels are never changed to match Jev's answers.

## 2026-09-30 — candidate distances made production-realistic (inputs only, no label changed)

The first live run scored triage_relevance 100% (59 test), triage_site 83.9% (31 test), and src_grade 88.2% (17 test).
Looking at its site misses showed the corpus contained inputs the pipeline cannot produce: `candidatesFor` in
`web/src/pipeline/ingest.ts` drops sites farther than `THRESHOLDS.candidateSiteMaxM` (5000 m), yet the `none` cases put
every site 5200–9400 m away and several other cases listed distractor sites at 5600–8100 m. In production those photos
would have had no candidate list at all, so the site question would never have been asked.

All candidate distances above 5000 m were replaced with values between 2600 m and 4900 m. No label, caption, tag, comment,
or OCR text was changed, and no case was added or removed. The whole corpus was rerun on live Jev; the result was the same
to the reported precision (83.9% site, 88.2% grade, 100% relevance), so the correction did not change the headline figures.

| Case ids | Field | Old | New |
|---|---|---|---|
| `site_gps_text_agree_*` | distractor site distances | 5600 m / 8100 m | 4600 m / 4900 m |
| `site_none_*` (GPS cases) | all site distances | 5200 / 6100 / 9400 m | 2600 / 3900 / 4700 m |
| `site_two_near_*` | third site distance | 6800–7200 m | 4300–4550 m |
