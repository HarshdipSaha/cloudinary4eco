# Binding UI/UX Rules for SAAKSHYA

Extracted from UI UX Pro Max guidance. Every surface in the console and paper mode must enforce these rules:

### Tables & Dense Lists
- Tabular figures (`font-variant-numeric: tabular-nums`) on all dates, coordinates, metrics, and currency/token counts.
- Row hover must provide immediate tactile feedback without shifting layout or changing row height.
- Keyboard navigation (Up/Down arrow, Enter, Space) must allow navigating and selecting items without mouse input.
- Empty table states must explain in one plain sentence what belongs here and provide the single action to populate it.

### Loading & Progress
- Skeleton rows must match the exact height and layout of the eventual content.
- Never use full-page spinners or spinners over image plates; show loading skeleton tracks or streaming progress bars.
- Streaming intake batches must show an active progress count and cost accumulation as NDJSON events arrive.

### Errors & Resilience
- Errors must state plainly: (1) what failed, and (2) what still works or how to recover.
- Service outages (Jev, CV worker, Cloudinary) must never invent or guess data; mark jobs honestly as `pending`.
- Offline states in mobile capture must store blobs locally and retry upon reconnect.

### Forms & Validation
- Every human override (changing a grade, setting aside evidence) strictly requires a non-empty reason.
- Inline validation with immediate feedback; never clear entered text upon validation errors.
- Text inputs must never intercept global application shortcuts (e.g. Space to flicker).

### Keyboard Shortcuts
- `Space` (hold): flickers immediately to baseline/prior without animation or fade.
- `1`, `2`, `3`, `4`: switches comparison mode between Side-by-side, Flicker, Wipe, and Difference.
- `E`: toggles alignment evidence (homography inlier points).
- Left/Right arrows: nudges wipe slider position in wipe mode.
- Visible focus rings (`2px solid var(--measure)`, 2px offset) on all interactive controls.

### Camera & Capture (Witness & Field)
- Public witness capture page must enforce direct camera capture (`capture="environment"`), blocking gallery uploads to prevent EXIF/GPS spoofing.
- Single-handed thumb-reachable shutter button positioned comfortably on mobile viewports.
- Ghost-overlay opacity slider and alignment indicator clearly visible in sunlight.

### Charts & Calibration
- Calibration reliability diagrams must display bin counts, sample size, Brier score, and ECE with small-sample caveats.
- Probability bars must display the full probability distribution across choices/scores, not just the top level.

### Icons & Accessible Labels
- No raw emojis as UI icons; use SVGs or semantic unicode glyph marks with `aria-hidden="true"`.
- Every icon button must have an explicit `aria-label` or accessible text.

### Next.js & React Architecture
- Server components for all initial data fetches directly from `getDb()`.
- Client components (`use client`) isolated to interactive islands (HangingProtocol, ServiceLamps, Search, Forms).
- Explicit `aspect-ratio` on all image containers to eliminate layout shifts (CLS).
- Responsive down to 375px; rail collapses to bottom bar below 768px.

### Pre-Delivery Checklist (Verbatim from uipro)
- [ ] No emojis as icons (use SVG: Heroicons/Lucide or geometric marks)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode / paper mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
