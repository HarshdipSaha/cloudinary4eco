# Design System Conflicts: uipro vs SAAKSHYA Impeccable Direction Contract

The Impeccable contract (§2.4 of the specification and plan) wins on look and visual identity; uipro wins on interactive UX, keyboard navigation, and accessibility rules.

1. **Palette:**
   - *uipro suggested:* Star gold `#F59E0B`, warm background `#FFFBEB`, destructive `#DC2626`.
   - *Contract keeps:* Graphite station (`--surface-0: #0B0E11`, `--surface-1: #12161A`, `--surface-2: #1A1F24`, `--line: #262D34`), caliper teal (`#5FB3A1`) for measurements, amber (`#D9A441`) for review, and red (`#E5484D`) strictly reserved for integrity flags.
   - *Rationale:* Medical imaging reading room aesthetic; red cannot be diluted for generic destructive buttons or routine warnings.

2. **Typography:**
   - *uipro suggested:* Inter for headings and body.
   - *Contract keeps:* Atkinson Hyperlegible Next (high-legibility signage sans), JetBrains Mono (tabular figures, coordinate overlays, metrics), and Source Serif 4 (for printed paper reports).
   - *Rationale:* High-legibility and tabular accuracy are essential for reading medical/spatial scan annotations and decimal coordinates.

3. **Layout & Cards:**
   - *uipro suggested:* Bento Box Grid with `rounded-xl` (16px), subtle drop shadows, and hover scale (1.02).
   - *Contract keeps:* Longitudinal Reading Station; flat plates with 1px border lines, 0px border radius on plates (max 2px on buttons/inputs), no shadows, no cards, no hover scaling.
   - *Rationale:* Refuses the generic consumer KPI-tile dashboard. Photographs are mounted as archival plates with scan corner annotations.

4. **Tone & Effects:**
   - *uipro suggested:* Consumer review sentiment colors, bouncy scale hover effects.
   - *Contract keeps:* Non-bouncing settle animation (120ms cubic-bezier(0.2, 0, 0, 1)), hard cuts on image flicker, states represented by geometric marks and text.
