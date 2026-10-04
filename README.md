# SAAKSHYA

Verifiable impact tracking for NGOs, CSR teams, and civic bodies.

**Status:** WINNNER OF THE HACKATHON🌟

**Live:** [saakshya-web.vercel.app](https://saakshya-web.vercel.app)

**Demo:** [Loom](https://www.loom.com/share/0dcab5f8f0b84e7c94952ccabbc167ec)

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

## What It Solves

Organizations running physical projects collect photos across sites and reporting periods. SAAKSHYA puts that evidence into a ledger so reviewers can compare site images, inspect integrity signals, accept independent witness submissions, and check report statements against cited evidence.

## How It Works

**Upload and inspect.** Images are uploaded directly from the browser to Cloudinary using server-signed parameters. SAAKSHYA reads metadata and analysis fields that are available, and records missing signals as missing.

**Register and measure.** The Python/OpenCV worker aligns follow-up images to a site's baseline and returns registration quality, change metrics, an aligned derivative, and a difference image. Jev makes typed decisions from the measurements and evidence supplied by SAAKSHYA; it does not inspect pixels.

**Review witness evidence.** A public site link accepts witness submissions without an account. Witness evidence enters the same evidence pipeline and can be reviewed alongside project evidence.

**Check reports.** The report composer drafts from ledger facts and asks Jev to check each sentence against its cited facts. The internal view shows kept, struck, and pending sentences with reasons. The public report view shows kept sentences. Print / PDF opens the browser's print dialog.

## Cloudinary Integration

Cloudinary handles signed image uploads, media storage, selected metadata, URL transformations, and structured asset lookup. It does not do SAAKSHYA's registration or change measurement.

| What it does | Current implementation |
|---|---|
| Signed direct image upload | Signs `image_metadata`, `phash`, and `faces`, plus the destination folder and optional context; the browser sends those exact parameters. |
| Available asset metadata | Reads GPS, capture time, pHash, face count, tags, and any caption/OCR fields actually returned. Missing values are recorded as missing. |
| Public image transforms | Selected image helpers apply face pixelation, automatic format, and quality transformations. Coverage depends on using those helpers. |
| Image composition | URL helpers build before/after side-by-side images and social crops from image assets. |
| Public video evidence | Imports a permitted public Cloudinary video URL and extracts <!-- claim:video.frames_per_import -->3<!-- /claim --> still frames for normal evidence ingestion. A video rubric page plays the video with each frame's observation linked to its timestamp, and builds one campaign card from human-accepted frames whose caption sentences Jev checks against ledger facts. |
| Structured search | Executes Cloudinary search expressions to retrieve asset IDs; the adapter supports filters, not free-text semantic search. |

The checked-in account probe records Cloudinary captioning, Google/AWS auto-tagging, Cloudinary AI tagging, and advanced OCR as unavailable at probe time; recheck before describing these add-ons as enabled. C2PA signing, Cloudinary difference analysis, video splicing/reframing, and "zero local image processing" are not current capabilities. See the [verified integration guide](docs/CLOUDINARY.md) for details and code references.

## Stack

| Layer | Technology |
|---|---|
| Web app | Next.js 15 (App Router), TypeScript, React 19 |
| Decisions | Jev by TypeSafe AI; unavailable decisions remain pending |
| Media | Cloudinary for signed upload, available metadata, storage, transformations, and structured search |
| CV worker | Python FastAPI + OpenCV for image registration and change metrics |
| Database | PostgreSQL-compatible ledger (PGlite locally; Neon or Supabase in production) |
| Report drafting | Groq-backed language model for prose drafting; Jev checks sentences against ledger facts |

## Current Product Flows

The app includes evidence intake and review, site evidence and registration views, public witness submission, evidence search, trust information, and report composition. External service availability affects which decisions can complete; unavailable decisions are recorded as pending rather than fabricated.

The [judge walkthrough](https://saakshya-web.vercel.app/judge) links the upload, comparison, stored decision receipt, witness submission, and report flows. Its downloadable images are seeded repository fixtures, not field evidence. Service-dependent steps show pending when a required service or record is unavailable.

## Running Locally

```bash
cd web
cp .env.example .env
# Set the Cloudinary, Jev, Groq, and CV worker values in .env.
# For a disposable local ledger, clear DATABASE_URL to use local PGlite.
npm install
npm run seed
npm run dev
```

CV worker (needed for image registration and change metrics):

```bash
cd cv
pip install -e .
uvicorn app.main:app --port 8001 --reload
```

## Project Principles

1. Measure, then decide, then write: numbers come from deterministic code, judgements from Jev, and prose is checked against the evidence ledger.
2. Claims should carry a receipt.
3. Uncertainty is shown; unavailable work remains pending.
4. Community members can submit independent evidence.
5. Nothing on screen should be presented as measured unless it was measured.

## Naming

SAAKSHYA is Sanskrit/Hindi for evidence and testimony.
