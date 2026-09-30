# SAAKSHYA Design & Interface System

## 1. System Intent & Aesthetic Philosophy

SAAKSHYA is an institutional-grade evidence ledger and longitudinal verification platform for field projects (afforestation, sanitation, water restoration, urban renewal). 

Its visual language embodies **judicial austerity and scientific transparency**:
- **Paper Metaphor**: The platform avoids flashy SaaS gradients, neon glows, and decorative AI gimmicks. Instead, it mirrors archival field ledgers and forensic documentation.
- **Evidence Over Assertions**: Reported image measurements and Jev decisions retain their recorded inputs where available; missing results stay missing or pending.
- **The Red Reservation**: The red hue (`#E5484D`) is strictly reserved across the entire system for **integrity flags** (recycled photos, out-of-radius coordinates, stale timestamps, registration failures). Red is never used for ordinary form validation or generic delete buttons.

---

## 2. Color Palette & Tokens

| Token | Hex | Role | Usage |
|---|---|---|---|
| `--bg` | `#FBFBF9` | Foundation | Background for console, reading lists, paper sheets |
| `--surface` | `#FFFFFF` | Canvas | Table rows, drawers, photo cards, report sheets |
| `--border` | `#E6E5DD` | Structure | Hairline dividers, table borders, card frames |
| `--text-1` | `#191918` | High-contrast | Primary headings, site titles, grades, fact assertions |
| `--text-2` | `#6D6C66` | Mid-contrast | Body labels, metadata keys, secondary commentary |
| `--text-3` | `#9E9D96` | Low-contrast | Timestamps, micro-badges, inactive states (≥ 13px) |
| `--flag` | `#E5484D` | **Strict Flag** | Integrity alerts, recycled photos, contradiction warnings |
| `--review` | `#F59E0B` | Needs Review | Low-confidence triage, human intervention required |
| `--active` | `#2563EB` | Focus/Selection | Active links, primary interactive controls, inlier points |
| `--verified` | `#10B981` | Corroborated | Significant positive change, corroborating witness reports |

---

## 3. Typography & Data Presentation

- **Primary Typeface**: High-legibility system sans (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`).
- **Data & Metric Typeface**: System Monospace (`ui-monospace, SFMono-Regular, "Cascadia Code", Consolas, monospace`) for all coordinates, asset IDs, homography matrices, token counts, latency measurements, and costs.
- **Microcopy Discipline**:
  - No marketing superlatives or "AI Magic".
  - Always state: What happened, the evidentiary basis, and what action is required.
  - The term "fraud" is never used in the UI; items are marked with **Integrity Checks**, allowing human adjudicators to decide intent.

---

## 4. Key Interactive Surfaces

### 4.1. Reading List Console Home (`/`)
- Pure structured reading ledger ordered strictly by urgency:
  1. Contested sites (community contradiction).
  2. Integrity flags (tampered EXIF, geo-drift, recycling).
  3. Pending reviews (low-confidence triage).
  4. Pending assessments (worker or model latency).
  5. Stale sites (> 7 days without follow-up).
  6. Healthy progressing sites.
- Single-line status digest summarizing immediate priorities.

### 4.2. Intake & Triage Wall (`/intake`)
- Drag-and-drop file ingestion and bulk WhatsApp chat ZIP unpacker.
- NDJSON-streamed ingestion showing processed items, recorded decision/token usage, and an estimated cost based on the configured per-token rate.
- Direct triage assignment with drawer drill-down.

### 4.3. Site Chart & Flicker Comparator (`/sites/[siteId]`)
- Longitudinal chronological timeline of site timepoints.
- **Spacebar Flicker Mode**: Rapid 500ms alternation between registered baseline and follow-up plate to spot subtle pixel differences instantly without saccadic eye motion.
- **Alignment Evidence (`E`)**: Shows the inlier correspondence points returned by the Python/OpenCV worker (SIFT features with OpenCV USAC_MAGSAC registration).
- Shows the Jev grade and returned probabilities when they are available. This is not a claim of empirical model calibration.

### 4.4. Integrity Review Queue (`/review`)
- Dedicated triage for flagged evidence with mandatory audit trail logging (`fromValue`, `toValue`, `reason`, `actor`).
- Dual-panel comparison showing suspected duplicate or recycled source photos.

### 4.5. Witness Mobile Capture (`/w/[slug]`)
- Mobile-first interface optimized for outdoor sunlight and one-handed operation.
- Requests an environment-facing camera and provides a browser capture-mode file fallback if the live viewfinder is unavailable. The browser or device controls which local sources that picker exposes.
- Real-time **Ghost Baseline Overlay** with Sobel edge extraction and normalized cross-correlation alignment meter to guide the witness into the exact baseline camera pose.
- IndexedDB offline outbox with automatic background retry when cellular signal drops.

### 4.6. Receipt-Linked Report Sheet (`/reports/[id]` & `/r/[slug]`)
- Groq-backed prose drafting uses the configured model; Jev checks sentences against cited ledger facts.
- Sentences with valid citations can be checked; uncited, invalid-citation, and unsupported sentences are struck, while unavailable checks remain pending.
- Kept sentences show cited fact text and an evidence thumbnail where available. Internal views link to the related site for inspection.

### 4.7. Trust & Calibration Portal (`/trust`)
- Shows the saved calibration artifact and its reliability bins, ECE, and Brier score only when that artifact is present.
- Results describe the evaluation corpus and do not establish that every live decision is calibrated.
- Displays a small-sample caveat alongside available evaluation results.

---

## 5. Technical & Security Invariants

1. **Media and privacy boundary**: Cloudinary stores original uploads and serves transformations. Selected public image helpers apply face pixelation; coverage depends on each public route using those helpers.
2. **Deterministic grading separation**: LLMs generate prose only; image measurements come from deterministic CV code and typed classifications come from Jev. Calibration claims require a corresponding evaluation artifact.
3. **Graceful Degradation**: If an AI or CV component is unavailable, the system never invents or mocks numbers. It honestly records `pending`, updates the queue, and presents the evidence transparently to human reviewers.
