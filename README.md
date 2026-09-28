# SAAKSHYA

Verifiable impact tracking for NGOs, CSR teams and civic bodies.

**Live:** [saakshya-web.vercel.app](https://saakshya-web.vercel.app)

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/07b68a33-2e87-4e0c-8c41-607d4385dbff" />

## Documentation

- [Product overview](docs/PRODUCT.md)
- [Technical specification](docs/SPECIFICATION_DOCUMENT.md)
- [Design system](docs/DESIGN.md)
- [Cloudinary integration guide](docs/CLOUDINARY.md)
- [Demo script](docs/DEMO_SCRIPT.md)
- [Problem statement research](docs/PROBLEM_STATEMENT_02_DEEP_RESEARCH.md)
- [Cloudinary media intelligence research](docs/CLOUDINARY_MEDIA_INTELLIGENCE_RESEARCH.md)
- [Literature recommendations](docs/LITERATURE_RECOMMENDATIONS.md)

---

## What It Solves

Organizations running physical projects (plantations, lake cleanups, borewells, school toilets) collect thousands of photos a year through WhatsApp, phone galleries and Drive folders. Three things break every time:

1. Before/after photos are taken from different spots and angles, so they prove nothing.
2. All evidence comes from the party claiming success. No independent check.
3. Donor reports are hand-written prose with no link to actual photos or measurements.

SAAKSHYA fixes all three.

---

## How It Works

Each site is treated like a patient in a longitudinal imaging study.

**Baseline + registered follow-ups.** Every site has a baseline photo. When a field worker takes a follow-up, the camera shows a ghost overlay of the baseline so they line up the same view. After upload, a computer vision step aligns the follow-up to the baseline. Before/after comparisons are pixel-aligned, not two unrelated photos.

**Site Response Criteria (SRC) grading.** Site change is graded on a rubric (for example, a plantation gets: established / partially established / no change / degraded). A Jev typed-decision model assigns the grade from measured change metrics and Cloudinary's visual analysis. Low-confidence grades go to a human reviewer.

**Independent citizen witnesses.** Each site gets a QR plaque. Any passer-by or volunteer scans it and submits a registered photo with no login. The site timeline shows whether community evidence agrees or disagrees with the implementer's claim.

**Reports with receipts.** A language model drafts the donor report only from the evidence ledger. Every sentence is then checked against the evidence it cites. Unsupported sentences are struck out before publication. Each surviving sentence links to its source photo, the measured change and the Jev decision that backs it.

---

## Cloudinary Integration

Cloudinary is the core visual computation engine, not just storage.

| What it does | How |
|---|---|
| Direct client upload | Upload presets + signed URLs, bypassing serverless body limits |
| EXIF/GPS preservation | `image_metadata: true` for legal proof of coordinates and time |
| AI tagging | `categorization: "google_tagging,aws_rek_tagging"` for biome and activity classification |
| OCR on site nameplates | `ocr: "adv_ocr:document"` to read certificate and equipment serials |
| Pixel difference heatmap | `e_difference` overlay to highlight canopy growth or trash clearance |
| Before/after split view | Dynamic layer compositing, assembled on the CDN with no server code |
| Face anonymization | `e_pixelate_faces:18` on every public image |
| Vertical video reframe | `c_fill,ar_9:16,g_auto:subject` for donor social content |
| C2PA provenance | `fl_c2pa` for cryptographically signed editing custody |
| Semantic search | `cloudinary.v2.search` across AI tags, OCR text and GPS |
| Eco delivery | `f_auto,q_auto:eco` to minimize data transfer emissions |

---

## Stack

| Layer | Technology |
|---|---|
| Web app | Next.js 15 (App Router), TypeScript, React 19 |
| Decisions | Jev by TypeSafe AI - every typed judgement goes through Jev |
| Media | Cloudinary - perception, transformation, delivery, search |
| CV worker | Python FastAPI + OpenCV for image registration and change metrics |
| Database | Postgres (PGlite for local, Neon/Supabase for production) |
| LLM | One generative model for drafting prose only, never for decisions |

---

## Four User-Facing Surfaces

**Intake** - Drop a 500-photo WhatsApp export. Each photo is assigned to a site, timepoint and activity, or flagged as duplicate/blurry/off-site. Cost is shown as the real measured number.

**Site Chart** - Timeline per site showing aligned before/after slider, timelapse, SRC grade history and whether citizen witnesses agree with the implementer.

**Witness Capture** - Public QR page (no login). Shows ghost overlay of the baseline for alignment. Works one-handed on low-end Android over flaky networks.

**Report** - Receipt-linked donor report. Every sentence links to its proof. Exports to PDF and a shareable public page.

---

## Running Locally

```bash
cd web
cp .env.example .env
# Fill in CLOUDINARY_*, DATABASE_URL, GROQ_API_KEY
npm install
npm run db:push
npm run dev
```

CV worker (optional for full registration):

```bash
cd cv
pip install -e .
uvicorn app:app --reload
```

---

## Project Principles

1. Measure, then decide, then write: numbers from deterministic code, judgements from Jev, prose last and checked.
2. Every claim carries a receipt.
3. Uncertainty is shown, never hidden. Low confidence routes to a human.
4. The community is a witness, not an audience.
5. Nothing on screen is projected or invented.

---

## Naming

SAAKSHYA is Sanskrit/Hindi for evidence and testimony.
