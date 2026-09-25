## Design System: SAAKSHYA

### Pattern
- **Name:** Product Review/Ratings Focused
- **Conversion Focus:** User-generated content builds trust. Show verified purchases. Filter by rating. Respond to negative reviews.
- **CTA Placement:** After reviews summary + Buy button alongside reviews
- **Color Strategy:** Trust colors. Star ratings gold. Verified badge green. Review sentiment colors.
- **Sections:** Hero (product + aggregate rating) > Rating breakdown > Individual reviews > Buy/CTA

### Style
- **Name:** Bento Box Grid
- **Mode Support:** Light supported | Dark supported
- **Keywords:** Modular cards, asymmetric grid, varied sizes, Apple-style, dashboard tiles, negative space, clean hierarchy, cards
- **Best For:** Dashboards, product pages, portfolios, Apple-style marketing, feature showcases, SaaS
- **Performance:** cost:low|drivers:none | **Accessibility:** risk:low|requires:contrast-text-4.5,keyboard,visible-focus,reduced-motion

### Colors
| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#F59E0B` | `--color-primary` |
| On Primary | `#0F172A` | `--color-on-primary` |
| Secondary | `#FBBF24` | `--color-secondary` |
| On Secondary | `#0F172A` | `--color-on-secondary` |
| Accent/CTA | `#16A34A` | `--color-accent` |
| On Accent/CTA | `#000000` | `--color-on-accent` |
| Background | `#FFFBEB` | `--color-background` |
| Foreground | `#0F172A` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#0F172A` | `--color-card-foreground` |
| Muted | `#FCF6F0` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#FAEEE1` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#000000` | `--color-ring` |

*Notes: Star gold + positive green + negative red*

### Typography
- **Heading:** Inter
- **Body:** Inter
- **Mood:** flat, clean, system, bold, geometric, cross-platform, icon, poster, minimal, functional, responsive
- **Best For:** Cross-platform apps, dashboards, system UI, onboarding, marketing pages, informational apps, icon-heavy interfaces
- **Google Fonts:** https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap
- **CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
```

### Key Effects
grid-template with varied spans, rounded-xl (16px), subtle shadows, hover scale (1.02), smooth transitions

### Avoid (Anti-patterns)
- No verified badges
- text-heavy pages
- hidden filter controls

### Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px

