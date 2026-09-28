# SAAKSHYA Design & Interface System

## 1. System Intent & Aesthetic Philosophy

SAAKSHYA is an institutional-grade evidence ledger and longitudinal verification platform for field projects (afforestation, sanitation, water restoration, urban renewal). 

Its visual language embodies **judicial austerity and scientific transparency**:
- **Paper Metaphor**: The platform avoids flashy SaaS gradients, neon glows, and decorative AI gimmicks. Instead, it mirrors archival field ledgers and forensic documentation.
- **Evidence Over Assertions**: Every grade, metric, and percentage is anchored to reproducible geometry and explicit decision records.
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
- Live NDJSON streamed ingestion displaying measured wall-clock time, token usage, and dollar cost ($0.0000X/batch).
- Direct triage assignment with drawer drill-down.

### 4.3. Site Chart & Flicker Comparator (`/sites/[siteId]`)
- Longitudinal chronological timeline of site timepoints.
- **Spacebar Flicker Mode**: Rapid 500ms alternation between registered baseline and follow-up plate to spot subtle pixel differences instantly without saccadic eye motion.
- **Alignment Dot Overlay (`E`)**: Interactive canvas rendering SIFT + MAGSAC++ inlier correspondence points across before/after pairs.
- Calibrated Site Response Criteria (SRC) grade distribution bar.

### 4.4. Integrity Review Queue (`/review`)
- Dedicated triage for flagged evidence with mandatory audit trail logging (`fromValue`, `toValue`, `reason`, `actor`).
- Dual-panel comparison showing suspected duplicate or recycled source photos.

### 4.5. Witness Mobile Capture (`/w/[slug]`)
- Mobile-first interface optimized for outdoor sunlight and one-handed operation.
- Camera-only capture (`capture="environment"`) to prevent gallery uploads.
- Real-time **Ghost Baseline Overlay** with Sobel edge extraction and normalized cross-correlation alignment meter to guide the witness into the exact baseline camera pose.
- IndexedDB offline outbox with automatic background retry when cellular signal drops.

### 4.6. Receipt-Linked Report Sheet (`/reports/[id]` & `/r/[slug]`)
- Fact-cited generative drafting using Llama 3.3 70B.
- Every sentence is mapped to specific numbered facts `[F1]`, `[F2]`.
- Jev sentence verification: Uncited, bogus-cited, or unsupported claims are visually struck out with inline margin justifications. Kept sentences link directly back to the original Cloudinary upload receipt.

### 4.7. Trust & Calibration Portal (`/trust`)
- Multi-bin reliability diagrams plotting predicted confidence against empirical empirical accuracy.
- Expected Calibration Error (ECE) and Brier Score computation.
- Explicit academic disclosure of small-sample variance caveats.

---

## 5. Technical & Security Invariants

1. **Cloudinary System of Record**: Original raw photos are immutable. Face pixelation (`e_pixelate_faces:20`) is strictly enforced on all public surfaces.
2. **Deterministic Grading Separation**: LLMs generate prose only; all numerical evaluations and categorical classifications are performed by deterministic CV algorithms and TypeSafe Jev calibrated decision models.
3. **Graceful Degradation**: If an AI or CV component is unavailable, the system never invents or mocks numbers. It honestly records `pending`, updates the queue, and presents the evidence transparently to human reviewers.
