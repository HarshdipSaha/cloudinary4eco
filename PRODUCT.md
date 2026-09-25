# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router, TypeScript, React 19) for the app and API routes; a Python FastAPI + OpenCV worker for image registration and change metrics; Postgres (Neon or Supabase) for the evidence ledger; Cloudinary for media; Jev (TypeSafe AI) for typed decisions; one generative LLM for drafting prose only. Two deployables: web app and CV worker.

## Users

Primary: the **program manager / auditor** at an NGO, CSR team or municipal body, working at a desk on a laptop. They sort months of field photos, check whether sites actually progressed, resolve flagged evidence and assemble the donor report. They are accountable for the claims and wary of being caught overclaiming.

Secondary: field workers and citizens capturing registered follow-up photos on a phone at the site (short, outdoor, one-handed sessions); donors and the public reading a site's public page or the report.

## Product Purpose

SAAKSHYA turns an unsorted pile of field photos into longitudinal, verifiable evidence per site. Each site is tracked like a patient: a baseline, registered follow-ups, a graded response on a standard rubric, independent citizen witnesses, and reports where every sentence links to its proof. Success: a manager goes from a 500-photo WhatsApp dump to a receipt-linked donor report in minutes, and an auditor can trace any claim to the original upload.

## Positioning

Photos are aligned to the site baseline at capture time and after upload, so before/after comparisons are the same view. Site change is graded on explicit Site Response Criteria borrowed from longitudinal medical imaging. Every discrete judgement is a typed, calibrated Jev decision, and the generative LLM never decides. The community is an independent witness channel, not just the implementer.

## Operating Context

Evidence arrives through WhatsApp exports, phone galleries, Drive folders and the site QR capture page. Work happens in review sessions before donor reporting deadlines. Outputs are a shareable report page, a PDF and a public site page reached from a QR plaque.

## Capabilities and Constraints

- Jev is text-only. Perception comes from Cloudinary analysis plus deterministic CV measurements.
- Jev choice cardinality ≤255. Model version pinned.
- No fabricated numbers anywhere: if a service is down, decisions show as pending.
- Original uploads are never modified or deleted.
- Faces are pixelated in every public view.
- Terminology: Site, Baseline, Follow-up, Timepoint, Registration (quality: good/weak/failed), Site Response Criteria (SRC) grade, Witness, Witness agreement (corroborates/contradicts/insufficient), Evidence ledger, Decision record, Receipt.

## Brand Commitments

Name: **SAAKSHYA** (Sanskrit/Hindi: evidence, testimony).

## Evidence on Hand

None yet. Real field photos of 4–5 Delhi sites must be captured by the team. Stock images must not be presented as field evidence. Demonstration data in development must be labelled synthetic.

## Product Principles

1. Measure, then decide, then write: numbers from deterministic code, judgements from Jev, prose last and checked.
2. Every claim carries a receipt.
3. Uncertainty is shown, never hidden. Low confidence routes to a human.
4. The community is a witness, not an audience.
5. Nothing on screen is projected or invented.

## Accessibility & Inclusion

WCAG 2.2 AA. The capture page must work outdoors in bright light, one-handed, on low-end Android over flaky networks.
