# Product

<!-- impeccable:product-schema 1 -->

## Platform

Web application with a separate Python CV worker.

## Current implementation

SAAKSHYA organizes evidence by project, site, and reporting period. It supports signed browser image uploads to Cloudinary, extraction of available metadata and integrity signals, evidence triage, Python/OpenCV image registration and change metrics, typed Jev decisions, public witness submissions, evidence search, and reports checked against ledger facts. The internal report view records kept, struck, and pending sentences; the public report view displays kept sentences. Browser print provides the PDF flow.

Cloudinary AI captioning, automatic tagging, and OCR are unavailable on the account described by the checked-in probe. Cloudinary does not perform image registration or difference analysis. A permitted public Cloudinary video can be imported as three still-frame evidence items; full-video analysis and editing are not implemented.

## Stack

Next.js 15 (App Router, TypeScript, React 19) for the web app and API routes; a Python FastAPI + OpenCV worker for image registration and change metrics; a PostgreSQL-compatible evidence ledger (PGlite locally, Neon or Supabase for hosted deployments); Cloudinary for media; Jev (TypeSafe AI) for typed decisions; and a Groq-backed language model for prose drafting. The web app and CV worker are separate deployables.

## Users

Primary: program managers and auditors at NGOs, CSR teams, or civic bodies who organize evidence, inspect site progress, review flags, and prepare reports.

Secondary: field workers and citizens submitting site evidence from a phone, and donors or community members inspecting public site or report pages.

## Product direction

SAAKSHYA aims to make physical-project claims inspectable over time. A site can have a baseline and follow-up images, registered comparisons, an SRC grade, independent witness evidence, and report statements tied to ledger facts. These goals do not imply bulk WhatsApp import, offline capture, automated video generation, or every future workflow is currently available.

## Operating context

The application supports evidence intake and review, site evidence and registration views, public witness submissions, evidence search, trust information, and report composition. External services affect whether a decision completes. When Jev is unavailable, the application records the relevant decision as pending.

## Capabilities and constraints

- Cloudinary signs browser uploads with `image_metadata`, `phash`, and `faces` and returns available metadata and analysis fields. Missing signals remain missing.
- The saved Cloudinary account probe records captioning, Google/AWS auto-tagging, Cloudinary tagging, and advanced OCR as unavailable. Optional response fields are not a dependable service capability.
- The Python/OpenCV worker performs registration and returns quality, aligned/difference derivatives, and image change metrics. This is local image processing; "zero local image processing" is inaccurate.
- Selected public image URL helpers apply face pixelation. Redaction depends on each public view using the appropriate helper; it is not an automatic guarantee across all routes.
- Jev makes text-based decisions from evidence and measurements supplied by the application. It does not inspect image pixels.
- A public video import yields three stills through the evidence pipeline. The application does not analyze the whole video or create video reels.
- The report composer checks sentence facts with Jev. Public reports show kept sentences; internal review can show kept, struck, and pending sentences. Print / PDF uses the browser's print dialog.
- Demo evidence and external-service state are deployment-specific. Label seeded or synthetic data and pending services clearly.

## Evidence and privacy commitments

Do not present seeded or synthetic images as field evidence. Treat EXIF GPS and capture time as editable signals, not cryptographic proof. Apply the public face-pixelation helper wherever required and verify its use on each public route.

## Product principles

1. Measure, then decide, then write: deterministic code supplies measurements, Jev makes typed decisions, and prose is checked against ledger facts.
2. Make claims inspectable through their evidence receipts.
3. Show uncertainty; leave unavailable decisions pending.
4. Make a public path for community-submitted evidence.
5. Label measurements and demo data according to their actual source.
