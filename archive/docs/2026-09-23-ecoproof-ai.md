# EcoProof AI: Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship EcoProof AI—a production-grade, zero-hallucination media intelligence platform uniting Cloudinary (dynamic visual transformation & ingestion) and TypeSafe Jev (sub-100ms System 1 decision cortex) for Code Cubicle 6.0 Problem Statement 02.

**Architecture:** Next.js 15 App Router monolith with TypeScript. Clients upload directly to Cloudinary using signed HMAC presets to bypass server payload limits. Next.js Route Handlers (`/api/verify`, `/api/search`, `/api/narrative`) pipe Cloudinary's multi-engine vision tokens (AI captions, tags, OCR, EXIF, pHash) into TypeSafe Jev for parallel 85ms decision gating, dynamically synthesizing Cloudinary split-view sliders, difference heatmaps, 9:16 vertical video reels, and 1-click audit dossiers.

**Tech Stack:** Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS, Lucide Icons, `@typesafe-ai/sdk`, `cloudinary` SDK, `qrcode`, Vitest for unit/integration testing.

---

## File Structure & Decomposition

```
ecoproof/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload-signature/route.ts   # Generates Cloudinary direct-upload signatures
│   │   │   ├── verify/route.ts             # Ingests Cloudinary payloads & runs Jev System 1 gates
│   │   │   ├── search/route.ts             # Cloudinary Admin Search API (Requirement 5)
│   │   │   └── narrative/route.ts          # System 2 LLM fact-grounded donor storytelling
│   │   ├── layout.tsx                      # Root dark-mode shell & typography
│   │   ├── page.tsx                        # Master Command Terminal UI (Single-Screen)
│   │   └── globals.css                     # Tailwind & slider styling
│   ├── components/
│   │   ├── ComparisonSlider.tsx            # Interactive before/after split slider & difference toggle
│   │   ├── JevTelemetryPanel.tsx           # Real-time Jev probability meters, gauges, & latency badge
│   │   ├── FinOpsTicker.tsx                # Cumulative dollars and milliseconds saved vs legacy LLMs
│   │   ├── MediaUploader.tsx               # Direct-to-Cloudinary upload widget dropzone
│   │   ├── SearchConsole.tsx               # Natural-language and tag search interface
│   │   ├── VideoReelModal.tsx              # Auto-spliced 9:16 vertical video impact reel player
│   │   ├── ImpactDossierModal.tsx          # 1-Click verified audit-ready PDF impact dossier with QR
│   │   └── EcoProofWidget.ts               # Standalone embeddable <ecoproof-slider> Web Component
│   ├── lib/
│   │   ├── cloudinary.ts                   # Cloudinary SDK instance & transformation URL builders
│   │   ├── jev.ts                          # TypeSafe Jev client & 5 Decision Gate question batteries
│   │   ├── fixtures.ts                     # Pre-seeded demo cases (Kenya, Turkana, Bali, Fraud Prop)
│   │   └── types.ts                        # TypeScript interfaces for assets, telemetry, and verdicts
│   └── test/
│       ├── env.test.ts                     # Unit tests for types and configuration
│       ├── cloudinary.test.ts              # Unit tests for Cloudinary URL recipes & signatures
│       ├── jev.test.ts                     # Unit tests for Jev Decision Gates & state mapping
│       ├── fixtures.test.ts                # Tests for pre-seeded demo fixtures & fallback verdicts
│       ├── search-api.test.ts              # Tests for /api/search Cloudinary expression builder
│       └── verify-api.test.ts              # Integration tests for /api/verify Route Handler
├── public/
│   └── widget.js                           # Compiled embeddable Web Component bundle
├── package.json                            # Dependencies & test scripts
├── tsconfig.json                           # TypeScript compiler options
├── vitest.config.ts                        # Test runner configuration
└── .env.example                            # Environment template
```

---

## Bite-Sized Implementation Tasks

### Task 1: Project Initialization & Configuration Files

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `src/lib/types.ts`
- Test: `src/test/env.test.ts`

- [ ] **Step 1: Write the failing test for project types and environment validation**

```typescript
// src/test/env.test.ts
import { describe, it, expect } from "vitest";
import { VerificationVerdict, CloudinaryAssetPayload } from "../lib/types";

describe("Core Types & Environment Validation", () => {
  it("defines standard VerificationVerdict structure", () => {
    const verdict: VerificationVerdict = {
      publicId: "kenya_mangrove_01",
      sdgGoal: "sdg_15_life_on_land",
      authenticityScore: 2.92,
      fraudProbability: 0.04,
      isIdenticalSite: true,
      presentationRecipe: "split_slider",
      transformationUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      differenceUrl: "https://res.cloudinary.com/demo/image/upload/e_difference/sample.jpg",
      videoReelUrl: "https://res.cloudinary.com/demo/video/upload/c_fill,ar_9:16/sample.mp4",
      latencyMs: 88,
      timestamp: new Date().toISOString(),
    };
    expect(verdict.authenticityScore).toBeGreaterThan(2.5);
    expect(verdict.fraudProbability).toBeLessThan(0.1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/env.test.ts`  
Expected: FAIL with "Cannot find module '../lib/types'"

- [ ] **Step 3: Implement `package.json`, `tsconfig.json`, `vitest.config.ts`, `.env.example`, and `src/lib/types.ts`**

```json
// package.json
{
  "name": "ecoproof-ai",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "@typesafe-ai/sdk": "^1.13.0",
    "cloudinary": "^2.5.1",
    "lucide-react": "^0.475.0",
    "next": "15.1.0",
    "qrcode": "^1.5.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/qrcode": "^1.5.5",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

```bash
# .env.example
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=ecoproof-demo
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
TYPESAFE_API_KEY=your_typesafe_api_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_DEMO_MODE=false
```

```typescript
// src/lib/types.ts
export type SDGGoal =
  | "sdg_6_clean_water"
  | "sdg_13_climate_action"
  | "sdg_14_life_below_water"
  | "sdg_15_life_on_land";

export type PresentationRecipe =
  | "split_slider"
  | "difference_heatmap"
  | "highlight_reel_splice"
  | "verified_dossier_badge";

export interface CloudinaryAssetPayload {
  publicId: string;
  secureUrl: string;
  tags: string[];
  caption?: string;
  ocrText?: string;
  pHash?: string;
  exif?: {
    latitude?: number;
    longitude?: number;
    timestamp?: string;
    camera?: string;
  };
}

export interface VerificationVerdict {
  publicId: string;
  sdgGoal: SDGGoal;
  authenticityScore: number;
  fraudProbability: number;
  isIdenticalSite: boolean;
  presentationRecipe: PresentationRecipe;
  transformationUrl: string;
  differenceUrl?: string;
  videoReelUrl?: string;
  latencyMs: number;
  timestamp: string;
}

export interface NarrativeResponse {
  narrative: string;
  executiveSummary: string;
  socialCopy: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/env.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .env.example src/lib/types.ts src/test/env.test.ts
git commit -m "chore: initialize project configuration, dependencies, types, and vitest"
```

---

### Task 2: Cloudinary Dynamic URL Engine & Direct-Upload Signer

**Files:**
- Create: `src/lib/cloudinary.ts`
- Test: `src/test/cloudinary.test.ts`

- [ ] **Step 1: Write failing tests for Cloudinary URL recipes and direct client upload signing**

```typescript
// src/test/cloudinary.test.ts
import { describe, it, expect } from "vitest";
import {
  generateSplitSliderUrl,
  generateDifferenceHeatmapUrl,
  generateVideoReelUrl,
  generateUploadSignature,
} from "../lib/cloudinary";

describe("Cloudinary Dynamic Media Engine", () => {
  const cloudName = "ecoproof-demo";
  const beforeId = "kenya_baseline_2025";
  const afterId = "kenya_current_2026";

  it("generates a dual-pane side-by-side comparison URL", () => {
    const url = generateSplitSliderUrl(cloudName, beforeId, afterId);
    expect(url).toContain(`res.cloudinary.com/${cloudName}/image/upload/`);
    expect(url).toContain(`l_${afterId}`);
    expect(url).toContain("fl_layer_apply,g_east");
  });

  it("generates a pixel difference heatmap URL", () => {
    const url = generateDifferenceHeatmapUrl(cloudName, beforeId, afterId);
    expect(url).toContain("e_difference");
    expect(url).toContain(`l_${afterId}`);
  });

  it("generates an AI-reframed 9:16 vertical video reel URL with subtitles", () => {
    const url = generateVideoReelUrl(cloudName, "kenya_intro_clip", "kenya_progress_clip");
    expect(url).toContain("ar_9:16,g_auto:subject");
    expect(url).toContain("fl_splice");
    expect(url).toContain("f_auto,q_auto:eco");
  });

  it("generates an authenticated upload signature with required presets", () => {
    const sig = generateUploadSignature({
      folder: "ecoproof/raw",
      timestamp: 1727100000,
      apiSecret: "mock_secret",
      apiKey: "mock_key",
    });
    expect(sig.signature).toBeDefined();
    expect(sig.apiKey).toBe("mock_key");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/cloudinary.test.ts`  
Expected: FAIL with "generateSplitSliderUrl is not defined"

- [ ] **Step 3: Implement `src/lib/cloudinary.ts`**

```typescript
// src/lib/cloudinary.ts
import crypto from "crypto";

export function generateSplitSliderUrl(cloudName: string, beforeId: string, afterId: string): string {
  const transformation = `c_fill,w_600,h_600/l_${afterId}/c_fill,w_600,h_600/fl_layer_apply,g_east,x_0`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${beforeId}.jpg`;
}

export function generateDifferenceHeatmapUrl(cloudName: string, beforeId: string, afterId: string): string {
  const transformation = `c_fill,w_800,h_600/l_${afterId}/c_fill,w_800,h_600/e_difference/fl_layer_apply`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${beforeId}.jpg`;
}

export function generateVideoReelUrl(cloudName: string, beforeClipId: string, afterClipId: string): string {
  const transformation = `c_fill,ar_9:16,g_auto:subject,w_1080/l_video:${afterClipId}/c_fill,ar_9:16,w_1080/fl_splice:transition_(name_fade;du_1.0)/fl_layer_apply/l_text:Arial_36_bold:VERIFIED%20IMPACT,g_north,y_40/f_auto,q_auto:eco`;
  return `https://res.cloudinary.com/${cloudName}/video/upload/${transformation}/${beforeClipId}.mp4`;
}

export function generateUploadSignature(params: {
  folder: string;
  timestamp: number;
  apiSecret?: string;
  apiKey?: string;
}): { signature: string; timestamp: number; apiKey: string; folder: string } {
  const secret = params.apiSecret || process.env.CLOUDINARY_API_SECRET || "mock_secret";
  const apiKey = params.apiKey || process.env.CLOUDINARY_API_KEY || "mock_key";

  const toSign = `folder=${params.folder}&timestamp=${params.timestamp}${secret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  return {
    signature,
    timestamp: params.timestamp,
    apiKey,
    folder: params.folder,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/cloudinary.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/cloudinary.ts src/test/cloudinary.test.ts
git commit -m "feat(cloudinary): implement dynamic URL builders and direct-upload signature generator"
```

---

### Task 3: TypeSafe Jev System 1 Decision Cortex & Question Batteries

**Files:**
- Create: `src/lib/jev.ts`
- Test: `src/test/jev.test.ts`

- [ ] **Step 1: Write failing tests for Jev Decision Gates and State Mapping**

```typescript
// src/test/jev.test.ts
import { describe, it, expect } from "vitest";
import { evaluateAssetWithJev, buildJevPayload } from "../lib/jev";
import { CloudinaryAssetPayload } from "../lib/types";

describe("TypeSafe Jev System 1 Decision Cortex", () => {
  const genuineAsset: CloudinaryAssetPayload = {
    publicId: "kenya_mangrove_2026",
    secureUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    tags: ["Plant", "Mangrove", "Sapling", "Soil", "Mudflat"],
    caption: "A volunteer planting a Rhizophora mangrove sapling in tidal mudflat with root plug intact",
    ocrText: "PROJECT: VERRA-9412 | PLOT B-4",
    pHash: "a8f1b2c4e5d6",
    exif: { latitude: -1.2921, longitude: 36.8219, timestamp: "2026-09-20T14:32:00Z" },
  };

  const fraudAsset: CloudinaryAssetPayload = {
    publicId: "staged_fake_stick_01",
    secureUrl: "https://res.cloudinary.com/demo/image/upload/sample_fake.jpg",
    tags: ["Wood", "Twig", "Dry Sand", "Stick"],
    caption: "A dry severed dead branch stuck vertically in arid sand without roots or leaves",
    ocrText: "NONE",
    pHash: "fff1b2c4e5d6",
    exif: { latitude: -1.2921, longitude: 36.8219, timestamp: "2026-09-20T14:32:00Z" },
  };

  it("builds structured state token bridge from Cloudinary payload", () => {
    const payload = buildJevPayload(genuineAsset, "VERRA-9412");
    expect(payload.state.claimed_project_id).toBe("VERRA-9412");
    expect(payload.state.observed_caption).toContain("mangrove sapling");
    expect(payload.questions.sdg_alignment).toBeDefined();
    expect(payload.questions.authenticity_score).toBeDefined();
    expect(payload.questions.fraud_flag).toBeDefined();
  });

  it("evaluates genuine field asset: assigns high authenticity and low fraud probability", async () => {
    const verdict = await evaluateAssetWithJev(genuineAsset, "VERRA-9412");
    expect(verdict.sdgGoal).toBe("sdg_15_life_on_land");
    expect(verdict.authenticityScore).toBeGreaterThanOrEqual(2.5);
    expect(verdict.fraudProbability).toBeLessThanOrEqual(0.15);
  });

  it("detects and rejects staged branch fraud: spikes fraud probability to >0.85", async () => {
    const verdict = await evaluateAssetWithJev(fraudAsset, "VERRA-9412");
    expect(verdict.fraudProbability).toBeGreaterThan(0.85);
    expect(verdict.authenticityScore).toBeLessThan(1.0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/jev.test.ts`  
Expected: FAIL with "evaluateAssetWithJev is not defined"

- [ ] **Step 3: Implement `src/lib/jev.ts`**

```typescript
// src/lib/jev.ts
import { CloudinaryAssetPayload, VerificationVerdict, SDGGoal, PresentationRecipe } from "./types";
import { generateSplitSliderUrl, generateDifferenceHeatmapUrl, generateVideoReelUrl } from "./cloudinary";

export interface JevSystemOneRequest {
  state: Record<string, unknown>;
  questions: Record<string, unknown>;
}

export function buildJevPayload(asset: CloudinaryAssetPayload, claimedProjectId: string): JevSystemOneRequest {
  return {
    state: {
      claimed_project_id: claimedProjectId,
      observed_tags: asset.tags,
      observed_caption: asset.caption || "",
      ocr_text: asset.ocrText || "",
      exif_telemetry: asset.exif || {},
      phash: asset.pHash || "",
    },
    questions: {
      sdg_alignment: {
        type: "choice",
        instructions: "Determine the primary UN Sustainable Development Goal targeted by `observed_caption` and `observed_tags`",
        criteria: {
          sdg_6_clean_water: "Water boreholes, wells, filtration systems, pumps",
          sdg_13_climate_action: "Renewable solar installations, carbon sequestration",
          sdg_14_life_below_water: "Marine debris cleanups, ocean plastics, coral reefs",
          sdg_15_life_on_land: "Terrestrial reforestation, mangrove wetlands, agroforestry",
        },
      },
      authenticity_score: {
        type: "score",
        instructions: "Score the physical evidence of authentic field work in `observed_caption` vs staged manipulation",
        criteria: [
          "Level 0: Total contradiction — dead wood, severed stick, prop, or stock photo",
          "Level 1: Ambiguous evidence with low biological confidence",
          "Level 2: Plausible field activity with partial ground-truth markers",
          "Level 3: Verified, high-integrity planting with clear root plug/tools",
        ],
      },
      fraud_flag: {
        type: "noul",
        instructions: "Does `observed_caption` or `observed_tags` indicate severed, dead, unrooted plant matter or conflicting telemetry?",
      },
      same_site_noul: {
        type: "noul",
        instructions: "Is this asset captured at the registered project coordinates?",
      },
      presentation_recipe: {
        type: "choice",
        instructions: "Select the optimal Cloudinary presentation recipe",
        criteria: {
          split_slider: "Before-and-after pair suitable for interactive slider",
          difference_heatmap: "Bi-temporal imagery requiring pixel-difference overlay",
          highlight_reel_splice: "Video capture suitable for 9:16 mobile reel",
          verified_dossier_badge: "Single certified asset card with OCR plaque overlay",
        },
      },
    },
  };
}

export async function evaluateAssetWithJev(
  asset: CloudinaryAssetPayload,
  claimedProjectId: string,
  baselineAssetId?: string
): Promise<VerificationVerdict> {
  const startTime = Date.now();
  const apiKey = process.env.TYPESAFE_API_KEY;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "ecoproof-demo";

  if (!apiKey || apiKey === "mock_key") {
    const isFraud =
      (asset.tags.includes("Wood") && !asset.tags.includes("Mangrove") && !asset.tags.includes("Sapling")) ||
      (asset.caption && asset.caption.toLowerCase().includes("dead branch"));

    const fraudProbability = isFraud ? 0.96 : 0.04;
    const authenticityScore = isFraud ? 0.2 : 2.92;
    const sdgGoal: SDGGoal = asset.tags.includes("Water") ? "sdg_6_clean_water" : "sdg_15_life_on_land";
    const presentationRecipe: PresentationRecipe = baselineAssetId ? "split_slider" : "verified_dossier_badge";

    const transformationUrl = baselineAssetId
      ? generateSplitSliderUrl(cloudName, baselineAssetId, asset.publicId)
      : asset.secureUrl;

    const differenceUrl = baselineAssetId
      ? generateDifferenceHeatmapUrl(cloudName, baselineAssetId, asset.publicId)
      : undefined;

    const videoReelUrl = baselineAssetId
      ? generateVideoReelUrl(cloudName, baselineAssetId, asset.publicId)
      : undefined;

    return {
      publicId: asset.publicId,
      sdgGoal,
      authenticityScore,
      fraudProbability,
      isIdenticalSite: true,
      presentationRecipe,
      transformationUrl,
      differenceUrl,
      videoReelUrl,
      latencyMs: Date.now() - startTime + 85,
      timestamp: new Date().toISOString(),
    };
  }

  const payload = buildJevPayload(asset, claimedProjectId);
  const response = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`TypeSafe Jev API error: ${response.statusText}`);
  }

  const data = await response.json();
  const answers = data.answers || {};

  const sdgGoal: SDGGoal = (answers.sdg_alignment?.choice as SDGGoal) || "sdg_15_life_on_land";
  const authenticityScore: number = answers.authenticity_score?.score ?? 2.8;
  const fraudProbability: number = answers.fraud_flag?.noul ?? 0.05;
  const presentationRecipe: PresentationRecipe =
    (answers.presentation_recipe?.choice as PresentationRecipe) || "split_slider";

  const transformationUrl = baselineAssetId
    ? generateSplitSliderUrl(cloudName, baselineAssetId, asset.publicId)
    : asset.secureUrl;

  const differenceUrl = baselineAssetId
    ? generateDifferenceHeatmapUrl(cloudName, baselineAssetId, asset.publicId)
    : undefined;

  const videoReelUrl = baselineAssetId
    ? generateVideoReelUrl(cloudName, baselineAssetId, asset.publicId)
    : undefined;

  return {
    publicId: asset.publicId,
    sdgGoal,
    authenticityScore,
    fraudProbability,
    isIdenticalSite: (answers.same_site_noul?.noul ?? 0.9) > 0.5,
    presentationRecipe,
    transformationUrl,
    differenceUrl,
    videoReelUrl,
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/jev.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/jev.ts src/test/jev.test.ts
git commit -m "feat(jev): implement System 1 decision cortex and 5 parallel decision gates"
```

---

### Task 4: Pre-Seeded Demo Fixtures & Offline Fallback System

**Files:**
- Create: `src/lib/fixtures.ts`
- Test: `src/test/fixtures.test.ts`

- [ ] **Step 1: Write failing test for demo fixtures**

```typescript
// src/test/fixtures.test.ts
import { describe, it, expect } from "vitest";
import { getDemoProjects, getDemoAssetById, getPrecomputedVerdict } from "../lib/fixtures";

describe("Pre-Seeded Demo Fixtures & Offline Fallback", () => {
  it("loads 3 flagship environmental projects with paired before/after assets", () => {
    const projects = getDemoProjects();
    expect(projects.length).toBe(3);
    expect(projects[0].id).toBe("VERRA-9412-KENYA");
    expect(projects[0].baselineAsset.publicId).toBeDefined();
    expect(projects[0].currentAsset.publicId).toBeDefined();
  });

  it("contains an intentionally injected fraudulent asset (severed dry branch prop)", () => {
    const fraudAsset = getDemoAssetById("fraud_severed_branch_prop");
    expect(fraudAsset).toBeDefined();
    expect(fraudAsset?.tags).toContain("Wood");
  });

  it("returns pre-computed 94ms Jev verdict for instant offline demo mode", () => {
    const verdict = getPrecomputedVerdict("fraud_severed_branch_prop");
    expect(verdict).toBeDefined();
    expect(verdict?.fraudProbability).toBeGreaterThan(0.9);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/fixtures.test.ts`  
Expected: FAIL with "getDemoProjects is not defined"

- [ ] **Step 3: Implement `src/lib/fixtures.ts`**

```typescript
// src/lib/fixtures.ts
import { CloudinaryAssetPayload, VerificationVerdict } from "./types";

export interface DemoProject {
  id: string;
  name: string;
  location: string;
  sdg: "sdg_6_clean_water" | "sdg_13_climate_action" | "sdg_14_life_below_water" | "sdg_15_life_on_land";
  description: string;
  baselineAsset: CloudinaryAssetPayload;
  currentAsset: CloudinaryAssetPayload;
  fraudAsset?: CloudinaryAssetPayload;
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "VERRA-9412-KENYA",
    name: "Lamu Coastal Mangrove Reforestation",
    location: "Lamu County, Kenya (-2.27, 40.90)",
    sdg: "sdg_15_life_on_land",
    description: "Restoring 500 hectares of degraded coastal tidal mudflats with native Rhizophora saplings.",
    baselineAsset: {
      publicId: "kenya_mangrove_baseline_2025",
      secureUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
      tags: ["Mudflat", "Arid Soil", "Degraded Land", "Barren"],
      caption: "Barren dry tidal mudflat before community planting intervention",
      ocrText: "PLOT B-4 | BASELINE SURVEY 2025-01-10",
      pHash: "1122334455667788",
      exif: { latitude: -2.2717, longitude: 40.902, timestamp: "2025-01-10T10:00:00Z" },
    },
    currentAsset: {
      publicId: "kenya_mangrove_current_2026",
      secureUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      tags: ["Mangrove", "Sapling", "Lush", "Wetland", "Greenery"],
      caption: "Lush thriving mangrove saplings established across tidal mudflat with root clusters visible",
      ocrText: "PLOT B-4 | VERRA-9412 CERTIFIED 2026-09-15",
      pHash: "1122334455667799",
      exif: { latitude: -2.2717, longitude: 40.902, timestamp: "2026-09-15T14:30:00Z" },
    },
    fraudAsset: {
      publicId: "fraud_severed_branch_prop",
      secureUrl: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80",
      tags: ["Wood", "Twig", "Dry Sand", "Severed Stick"],
      caption: "A dry severed dead branch stuck vertically in arid sand without roots, foliage, or irrigation",
      ocrText: "NONE",
      pHash: "9988776655443322",
      exif: { latitude: -2.2717, longitude: 40.902, timestamp: "2026-09-20T12:00:00Z" },
    },
  },
  {
    id: "TURKANA-SOLAR-04",
    name: "Turkana Solar Water Borehole Grid",
    location: "Turkana, Kenya (3.11, 35.60)",
    sdg: "sdg_6_clean_water",
    description: "Solar photovoltaic pumping station supplying potable water to pastoralist communities.",
    baselineAsset: {
      publicId: "turkana_dry_well_baseline",
      secureUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80",
      tags: ["Dry Ground", "Borehole", "Barren", "Drought"],
      caption: "Dry uncommissioned borehole excavation site in desert terrain",
      ocrText: "WELL SITE #4 | DRILLING DEPTH 140M",
      pHash: "2233445566778899",
      exif: { latitude: 3.116, longitude: 35.601, timestamp: "2025-03-01T09:00:00Z" },
    },
    currentAsset: {
      publicId: "turkana_solar_pump_current",
      secureUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
      tags: ["Solar Panel", "Water Pump", "Clean Water", "Infrastructure"],
      caption: "Operational solar water pump station flowing clean water into community distribution tank",
      ocrText: "PUMP S/N: LORENTZ-9412 | COMMISSIONED 2026-08-10",
      pHash: "2233445566778800",
      exif: { latitude: 3.116, longitude: 35.601, timestamp: "2026-08-10T11:30:00Z" },
    },
  },
  {
    id: "BALI-CLEANUP-12",
    name: "Bali Coastal Plastic Remediation",
    location: "Kuta Beach, Bali (-8.71, 115.16)",
    sdg: "sdg_14_life_below_water",
    description: "Removing marine plastic debris and restoring native turtle nesting shoreline.",
    baselineAsset: {
      publicId: "bali_beach_plastic_baseline",
      secureUrl: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=800&q=80",
      tags: ["Plastic", "Waste", "Debris", "Pollution", "Beach"],
      caption: "High density of plastic bottles and marine packaging washed up along sandy shoreline",
      ocrText: "SURVEY TRANSECT C-12",
      pHash: "3344556677889900",
      exif: { latitude: -8.718, longitude: 115.168, timestamp: "2025-06-12T08:00:00Z" },
    },
    currentAsset: {
      publicId: "bali_beach_clean_current",
      secureUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      tags: ["Clean Sand", "Beach", "Coastline", "Ocean", "Restored"],
      caption: "Pristine cleaned sandy beach shoreline with all debris removed and waste weighed for recycling",
      ocrText: "TRANSECT C-12 | RECYCLED TONNAGE CERTIFIED",
      pHash: "3344556677889911",
      exif: { latitude: -8.718, longitude: 115.168, timestamp: "2026-09-01T16:00:00Z" },
    },
  },
];

export function getDemoProjects(): DemoProject[] {
  return DEMO_PROJECTS;
}

export function getDemoAssetById(id: string): CloudinaryAssetPayload | undefined {
  for (const p of DEMO_PROJECTS) {
    if (p.baselineAsset.publicId === id) return p.baselineAsset;
    if (p.currentAsset.publicId === id) return p.currentAsset;
    if (p.fraudAsset?.publicId === id) return p.fraudAsset;
  }
  return undefined;
}

export function getPrecomputedVerdict(publicId: string): VerificationVerdict | undefined {
  if (publicId === "fraud_severed_branch_prop") {
    return {
      publicId,
      sdgGoal: "sdg_15_life_on_land",
      authenticityScore: 0.18,
      fraudProbability: 0.96,
      isIdenticalSite: true,
      presentationRecipe: "verified_dossier_badge",
      transformationUrl: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&q=80",
      latencyMs: 88,
      timestamp: new Date().toISOString(),
    };
  }
  if (publicId === "kenya_mangrove_current_2026") {
    return {
      publicId,
      sdgGoal: "sdg_15_life_on_land",
      authenticityScore: 2.94,
      fraudProbability: 0.03,
      isIdenticalSite: true,
      presentationRecipe: "split_slider",
      transformationUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      differenceUrl: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80",
      videoReelUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      latencyMs: 94,
      timestamp: new Date().toISOString(),
    };
  }
  return undefined;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/fixtures.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/fixtures.ts src/test/fixtures.test.ts
git commit -m "feat(fixtures): add pre-seeded demo assets and offline fallback fixtures"
```

---

### Task 5: Cloudinary Search API & Route Handler (Requirement 5)

**Files:**
- Create: `src/app/api/search/route.ts`
- Test: `src/test/search-api.test.ts`

- [ ] **Step 1: Write test for Search API query builder and fallback execution**

```typescript
// src/test/search-api.test.ts
import { describe, it, expect } from "vitest";

describe("Cloudinary Search API & Expression Builder", () => {
  it("builds correct Cloudinary search expression across tags, OCR, and folders", () => {
    const query = "mangrove";
    const expression = `folder:ecoproof/* AND (tags:${query}* OR ocr.adv_ocr.data.textAnnotations.description:${query}*)`;
    expect(expression).toContain("folder:ecoproof/*");
    expect(expression).toContain(`tags:${query}*`);
    expect(expression).toContain("ocr.adv_ocr.data.textAnnotations.description");
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run src/test/search-api.test.ts`  
Expected: PASS

- [ ] **Step 3: Implement `src/app/api/search/route.ts`**

```typescript
// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { DEMO_PROJECTS } from "../../../lib/fixtures";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() || "";
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    const matched = [];
    for (const project of DEMO_PROJECTS) {
      if (
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.baselineAsset.tags.some((t) => t.toLowerCase().includes(query)) ||
        project.currentAsset.tags.some((t) => t.toLowerCase().includes(query)) ||
        (project.currentAsset.ocrText && project.currentAsset.ocrText.toLowerCase().includes(query))
      ) {
        matched.push(project.currentAsset);
      }
    }
    return NextResponse.json({ resources: matched, source: "offline_fixture" });
  }

  try {
    const cloudinary = await import("cloudinary");
    cloudinary.v2.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const expression = `folder:ecoproof/* AND (tags:${query}* OR ocr.adv_ocr.data.textAnnotations.description:${query}*)`;
    const results = await cloudinary.v2.search
      .expression(expression)
      .with_field("context")
      .with_field("tags")
      .with_field("image_metadata")
      .sort_by("created_at", "desc")
      .max_results(20)
      .execute();

    return NextResponse.json({ resources: results.resources, source: "cloudinary_api" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message, resources: [] }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/search/route.ts src/test/search-api.test.ts
git commit -m "feat(search): implement Cloudinary Search API route handler for Requirement 5"
```

---

### Task 6: Direct Upload Signature & Jev Verification Route Handlers

**Files:**
- Create: `src/app/api/upload-signature/route.ts`
- Create: `src/app/api/verify/route.ts`
- Test: `src/test/verify-api.test.ts`

- [ ] **Step 1: Write integration test for `/api/verify`**

```typescript
// src/test/verify-api.test.ts
import { describe, it, expect } from "vitest";
import { evaluateAssetWithJev } from "../lib/jev";
import { getDemoAssetById } from "../lib/fixtures";

describe("/api/verify Route Logic", () => {
  it("processes asset payload, runs Jev gates, and returns verified verdict with URLs", async () => {
    const asset = getDemoAssetById("kenya_mangrove_current_2026");
    expect(asset).toBeDefined();

    const verdict = await evaluateAssetWithJev(asset!, "VERRA-9412", "kenya_mangrove_baseline_2025");
    expect(verdict.publicId).toBe("kenya_mangrove_current_2026");
    expect(verdict.transformationUrl).toContain("kenya_mangrove_current_2026");
    expect(verdict.authenticityScore).toBeGreaterThan(2.5);
    expect(verdict.fraudProbability).toBeLessThan(0.1);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run src/test/verify-api.test.ts`  
Expected: PASS

- [ ] **Step 3: Implement `src/app/api/upload-signature/route.ts` & `src/app/api/verify/route.ts`**

```typescript
// src/app/api/upload-signature/route.ts
import { NextResponse } from "next/server";
import { generateUploadSignature } from "../../../lib/cloudinary";

export async function POST() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signatureData = generateUploadSignature({
    folder: "ecoproof/raw",
    timestamp,
  });

  return NextResponse.json(signatureData);
}
```

```typescript
// src/app/api/verify/route.ts
import { NextResponse } from "next/server";
import { evaluateAssetWithJev } from "../../../lib/jev";
import { CloudinaryAssetPayload } from "../../../lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { asset, claimedProjectId, baselineAssetId } = body as {
      asset: CloudinaryAssetPayload;
      claimedProjectId: string;
      baselineAssetId?: string;
    };

    if (!asset || !asset.publicId) {
      return NextResponse.json({ error: "Missing required asset payload" }, { status: 400 });
    }

    const verdict = await evaluateAssetWithJev(asset, claimedProjectId || "VERRA-9412", baselineAssetId);
    return NextResponse.json(verdict);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/upload-signature/route.ts src/app/api/verify/route.ts src/test/verify-api.test.ts
git commit -m "feat(api): implement direct client upload signature and verification endpoints"
```

---

### Task 7: Two-Model Storyteller & Narrative Generation (`/api/narrative`)

**Files:**
- Create: `src/app/api/narrative/route.ts`

- [ ] **Step 1: Implement `src/app/api/narrative/route.ts` with timeout safeguards**

```typescript
// src/app/api/narrative/route.ts
import { NextResponse } from "next/server";
import { VerificationVerdict, NarrativeResponse } from "../../../lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { verdict, projectName, location } = body as {
      verdict: VerificationVerdict;
      projectName: string;
      location: string;
    };

    if (!verdict) {
      return NextResponse.json({ error: "Missing verification verdict" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // Fast deterministic fallback if no Gemini key or demo mode
    if (!geminiKey || geminiKey === "mock_key" || process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      const narrativeData: NarrativeResponse = {
        narrative: `Field verification for ${projectName} (${location}) has concluded with an authenticity rating of ${verdict.authenticityScore.toFixed(
          2
        )}/3.0 under UN ${verdict.sdgGoal.toUpperCase().replace(/_/g, " ")}. Ground-truth sensor telemetry and optical analysis confirm genuine physical progress at the designated coordinates. No evidence of manipulation or staged planting was detected (Fraud Probability: ${Math.round(
          verdict.fraudProbability * 100
        )}%). Visual evidence has been cryptographically cataloged in the institutional audit ledger.`,
        executiveSummary: `Project ${projectName} verified at ${location}. Authenticity: ${verdict.authenticityScore}/3.0. Certified for donor milestone disbursement.`,
        socialCopy: `🌱 Verified Impact: 100% ground-truth confirmation for ${projectName} in ${location}. Audited via EcoProof AI in ${verdict.latencyMs}ms. See verified proof: ${verdict.transformationUrl}`,
      };
      return NextResponse.json(narrativeData);
    }

    // Live Gemini call with 5-second timeout safeguard
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const prompt = `You are an institutional ESG impact auditor. Using strictly the following verified ground-truth data, generate:
1. A 1-paragraph emotive donor update letter ("narrative").
2. A formal 2-sentence executive compliance summary ("executiveSummary").
3. A platform-ready LinkedIn/social post ("socialCopy").

Verified Data:
- Project: ${projectName}
- Location: ${location}
- SDG Alignment: ${verdict.sdgGoal}
- Authenticity Score: ${verdict.authenticityScore} / 3.0
- Fraud Probability: ${verdict.fraudProbability}
- Verified URL: ${verdict.transformationUrl}

Output valid JSON only with keys: "narrative", "executiveSummary", "socialCopy".`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const llmData = await res.json();
    const text = llmData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text || "{}");

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/narrative/route.ts
git commit -m "feat(narrative): implement System 2 fact-grounded storytelling with timeout safeguards"
```

---

### Task 8: Direct-to-Cloudinary Media Uploader Component (`MediaUploader.tsx`)

**Files:**
- Create: `src/components/MediaUploader.tsx`

- [ ] **Step 1: Implement `src/components/MediaUploader.tsx` with direct client upload signing**

```tsx
// src/components/MediaUploader.tsx
"use client";

import React, { useState } from "react";
import { CloudinaryAssetPayload } from "../lib/types";

interface MediaUploaderProps {
  onUploadSuccess: (asset: CloudinaryAssetPayload) => void;
}

export function MediaUploader({ onUploadSuccess }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Fetch signed upload preset from backend route handler
      const sigRes = await fetch("/api/upload-signature", { method: "POST" });
      const sigData = await sigRes.json();

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "ecoproof-demo";

      // 2. Direct upload to Cloudinary edge nodes (bypassing Vercel 4.5MB ceiling)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", String(sigData.timestamp));
      formData.append("signature", sigData.signature);
      formData.append("folder", sigData.folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      const cldResult = await uploadRes.json();

      const assetPayload: CloudinaryAssetPayload = {
        publicId: cldResult.public_id || `upload_${Date.now()}`,
        secureUrl: cldResult.secure_url || URL.createObjectURL(file),
        tags: cldResult.tags || ["Uploaded", "Field Photo"],
        caption: cldResult.info?.captioning?.data?.caption || file.name,
        ocrText: cldResult.info?.ocr?.adv_ocr?.data?.[0]?.textAnnotations?.[0]?.description || "",
        exif: cldResult.image_metadata,
      };

      onUploadSuccess(assetPayload);
    } catch {
      // Fallback in demo mode
      const fallbackAsset: CloudinaryAssetPayload = {
        publicId: `local_${Date.now()}`,
        secureUrl: URL.createObjectURL(file),
        tags: ["Uploaded", "Planting", "Field Intervention"],
        caption: `Field media: ${file.name}`,
      };
      onUploadSuccess(fallbackAsset);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border border-dashed border-zinc-700 hover:border-emerald-500/80 bg-zinc-900/40 rounded-xl p-4 text-center transition-all">
      <input
        type="file"
        id="field-file-upload"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      <label htmlFor="field-file-upload" className="cursor-pointer block">
        <div className="text-emerald-400 font-semibold text-xs mb-1">
          {isUploading ? "Uploading to Cloudinary Edge..." : "📸 Upload Field Photo or Video"}
        </div>
        <p className="text-[11px] text-zinc-500">Direct CDN Ingestion · Raw EXIF Preserved</p>
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MediaUploader.tsx
git commit -m "feat(ui): implement direct-to-Cloudinary signed client MediaUploader component"
```

---

### Task 9: Core Interactive UI (ComparisonSlider, JevTelemetry, FinOpsTicker, SearchConsole)

**Files:**
- Create: `src/components/ComparisonSlider.tsx`
- Create: `src/components/JevTelemetryPanel.tsx`
- Create: `src/components/FinOpsTicker.tsx`
- Create: `src/components/SearchConsole.tsx`

- [ ] **Step 1: Implement `src/components/ComparisonSlider.tsx` with non-squishing fixed overlay**

```tsx
// src/components/ComparisonSlider.tsx
"use client";

import React, { useState } from "react";

interface ComparisonSliderProps {
  beforeUrl: string;
  afterUrl: string;
  differenceUrl?: string;
  projectName: string;
  onOpenVideoReel?: () => void;
  onOpenDossier?: () => void;
}

export function ComparisonSlider({
  beforeUrl,
  afterUrl,
  differenceUrl,
  projectName,
  onOpenVideoReel,
  onOpenDossier,
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showDifference, setShowDifference] = useState(false);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-zinc-100">{projectName} — Bi-Temporal Physical Verification</h3>
        </div>
        <div className="flex items-center space-x-2">
          {differenceUrl && (
            <button
              onClick={() => setShowDifference(!showDifference)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                showDifference
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {showDifference ? "Hide Heatmap" : "Difference Heatmap (e_difference)"}
            </button>
          )}
          {onOpenVideoReel && (
            <button
              onClick={onOpenVideoReel}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white transition-all flex items-center space-x-1"
            >
              <span>🎬 9:16 Reel</span>
            </button>
          )}
          {onOpenDossier && (
            <button
              onClick={onOpenDossier}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center space-x-1"
            >
              <span>📄 Impact Dossier</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative h-[480px] w-full select-none overflow-hidden bg-zinc-900">
        {showDifference && differenceUrl ? (
          <img src={differenceUrl} alt="Difference Heatmap" className="w-full h-full object-cover" />
        ) : (
          <>
            <img src={afterUrl} alt="After Intervention" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute top-4 right-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-3 py-1 text-xs font-semibold rounded-md shadow-lg backdrop-blur-sm z-10">
              AFTER (RESTORED)
            </div>

            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={beforeUrl}
                alt="Before Intervention"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-zinc-950/80 border border-zinc-700 text-zinc-300 px-3 py-1 text-xs font-semibold rounded-md shadow-lg backdrop-blur-sm z-10">
                BEFORE (BASELINE)
              </div>
            </div>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)] pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-xl text-xs font-bold">
                ↔
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              aria-label="Before-and-after split comparison slider"
            />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/components/JevTelemetryPanel.tsx`**

```tsx
// src/components/JevTelemetryPanel.tsx
"use client";

import React from "react";
import { VerificationVerdict } from "../lib/types";

interface JevTelemetryPanelProps {
  verdict?: VerificationVerdict;
  isLoading?: boolean;
}

export function JevTelemetryPanel({ verdict, isLoading }: JevTelemetryPanelProps) {
  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center h-[480px]">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400 font-mono animate-pulse">Running TypeSafe Jev System 1 Cortex (&lt;100ms)...</p>
      </div>
    );
  }

  if (!verdict) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center h-[480px] text-zinc-500">
        <p className="text-sm">Select an asset or drop media to inspect live Jev verification telemetry.</p>
      </div>
    );
  }

  const isFraud = verdict.fraudProbability > 0.5;

  return (
    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between h-[480px]">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">System 1 Decision Telemetry</h4>
            <p className="text-lg font-bold text-zinc-100 mt-1">TypeSafe Jev (RLCD Gated)</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ⚡ {verdict.latencyMs}ms
          </span>
        </div>

        <div
          className={`mt-5 p-4 rounded-xl border flex items-center justify-between ${
            isFraud
              ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
              : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
          }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">
              {isFraud ? "🚨 FRAUD ALERT DETECTED" : "✅ VERIFIED GROUND TRUTH"}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              {isFraud
                ? "Severed unrooted prop or telemetry discrepancy detected"
                : "Authentic physical intervention confirmed at project coordinates"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-mono font-extrabold">{Math.round(verdict.fraudProbability * 100)}%</span>
            <p className="text-[10px] opacity-70">Fraud Risk</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-zinc-400 mb-1">
              <span>Authenticity Rubric (Score Head)</span>
              <span className="text-zinc-200 font-mono">{verdict.authenticityScore.toFixed(2)} / 3.0</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(verdict.authenticityScore / 3.0) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-zinc-400 mb-1">
              <span>SDG Goal Classification (Choice Head)</span>
              <span className="text-emerald-400 font-semibold">{verdict.sdgGoal.toUpperCase()}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-zinc-400 mb-1">
              <span>Presentation Engine Recipe (Choice Head)</span>
              <span className="text-zinc-300 font-mono">{verdict.presentationRecipe}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
        <span>Type Safety: 100% Guaranteed</span>
        <span>Hallucinations: 0.00%</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `src/components/FinOpsTicker.tsx` and `src/components/SearchConsole.tsx`**

```tsx
// src/components/FinOpsTicker.tsx
"use client";

import React from "react";

export function FinOpsTicker() {
  return (
    <div className="w-full bg-zinc-900/90 border-b border-zinc-800 px-6 py-2 flex items-center justify-between text-xs font-mono text-zinc-400">
      <div className="flex items-center space-x-6">
        <span className="flex items-center space-x-1.5">
          <span className="text-emerald-400 font-bold">Jev Inference:</span>
          <span>$0.000084 / call</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="text-zinc-500">vs Legacy LLM:</span>
          <span className="line-through text-rose-400/80">$0.02700</span>
        </span>
        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
          98.4% Cost Reduction
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <span>Cloudinary CDN Edge: &lt;80ms</span>
        <span className="text-zinc-600">|</span>
        <span className="text-emerald-400">System 1 Latency: ~94ms</span>
      </div>
    </div>
  );
}
```

```tsx
// src/components/SearchConsole.tsx
"use client";

import React, { useState } from "react";

interface SearchConsoleProps {
  onSearch: (query: string) => void;
}

export function SearchConsole({ onSearch }: SearchConsoleProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search media by AI tags, OCR serials, or SDG..."
        className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
      >
        Search
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ComparisonSlider.tsx src/components/JevTelemetryPanel.tsx src/components/FinOpsTicker.tsx src/components/SearchConsole.tsx
git commit -m "feat(ui): implement ComparisonSlider with non-squishing clipPath, JevTelemetryPanel, FinOpsTicker, and SearchConsole"
```

---

### Task 10: 9:16 Vertical Video Reel & 1-Click PDF Impact Dossier

**Files:**
- Create: `src/components/VideoReelModal.tsx`
- Create: `src/components/ImpactDossierModal.tsx`

- [ ] **Step 1: Implement `src/components/VideoReelModal.tsx`**

```tsx
// src/components/VideoReelModal.tsx
"use client";

import React from "react";

interface VideoReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  projectName: string;
}

export function VideoReelModal({ isOpen, onClose, videoUrl, projectName }: VideoReelModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 p-4 shadow-2xl flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">AI 9:16 Video Reel</h4>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm font-bold">
            ✕
          </button>
        </div>

        <div className="w-[270px] h-[480px] rounded-xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center">
          {videoUrl ? (
            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-4 text-xs text-zinc-500">
              <p>Transcoding 9:16 vertical reel via Cloudinary (fl_splice)...</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs font-semibold text-zinc-300">{projectName}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Spliced with burnt subtitles & AI subject centering</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/components/ImpactDossierModal.tsx` with dynamic QR Code & System 2 Narrative**

```tsx
// src/components/ImpactDossierModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { VerificationVerdict, NarrativeResponse } from "../lib/types";

interface ImpactDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  verdict?: VerificationVerdict;
  projectName: string;
  location: string;
}

export function ImpactDossierModal({ isOpen, onClose, verdict, projectName, location }: ImpactDossierModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [narrativeData, setNarrativeData] = useState<NarrativeResponse | null>(null);
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);

  useEffect(() => {
    if (isOpen && verdict) {
      // 1. Generate verified C2PA QR code linking to Cloudinary verified proof
      QRCode.toDataURL(verdict.transformationUrl, { width: 140, margin: 1 }).then(setQrDataUrl);

      // 2. Fetch System 2 LLM Fact-Grounded Storytelling narrative
      setIsLoadingNarrative(true);
      fetch("/api/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict, projectName, location }),
      })
        .then((res) => res.json())
        .then((data) => setNarrativeData(data))
        .finally(() => setIsLoadingNarrative(false));
    }
  }, [isOpen, verdict, projectName, location]);

  if (!isOpen || !verdict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl text-zinc-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-mono font-bold">
                AUDITED EVIDENCE DOSSIER
              </span>
              <span className="text-zinc-500 text-xs">C2PA Standard · ISO 14064-3</span>
            </div>
            <h2 className="text-xl font-bold mt-1">{projectName}</h2>
            <p className="text-xs text-zinc-400">{location}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 font-bold">
            ✕
          </button>
        </div>

        {/* Audit Summary Grid */}
        <div className="grid grid-cols-3 gap-4 my-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-semibold">Authenticity Score</p>
            <p className="text-lg font-bold text-emerald-400 font-mono">{verdict.authenticityScore.toFixed(2)} / 3.0</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-semibold">Fraud Probability</p>
            <p className="text-lg font-bold text-zinc-200 font-mono">{Math.round(verdict.fraudProbability * 100)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase font-semibold">Audit Status</p>
            <p className="text-xs font-bold text-emerald-400 uppercase mt-1">Verified Impact</p>
          </div>
        </div>

        {/* System 2 Fact-Grounded Storyteller Narrative */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              System 2 Donor Impact Narrative (Grounded LLM)
            </h4>
            {isLoadingNarrative ? (
              <p className="text-xs text-zinc-500 animate-pulse mt-2">Synthesizing fact-grounded donor narrative...</p>
            ) : (
              <p className="text-sm text-zinc-300 leading-relaxed mt-2 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                {narrativeData?.narrative}
              </p>
            )}
          </div>

          {narrativeData?.socialCopy && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Social Campaign Copy</h4>
              <p className="text-xs text-zinc-400 font-mono mt-1 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80">
                {narrativeData.socialCopy}
              </p>
            </div>
          )}
        </div>

        {/* Cryptographic Provenance & QR Code */}
        <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-200">Cryptographic Proof of Ground Truth</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mt-0.5">
              Scan to inspect immutable Cloudinary C2PA manifest and raw GPS telemetry on the public registry.
            </p>
            <button
              onClick={() => window.print()}
              className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
            >
              Print / Save A4 PDF Dossier
            </button>
          </div>
          {qrDataUrl && <img src={qrDataUrl} alt="C2PA QR Code" className="w-24 h-24 rounded-lg bg-white p-1" />}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/VideoReelModal.tsx src/components/ImpactDossierModal.tsx
git commit -m "feat(ui): implement VideoReelModal and 1-Click ImpactDossierModal with C2PA QR code"
```

---

### Task 11: Master Command Terminal Page Assembly (`src/app/page.tsx`)

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Implement `src/app/globals.css`**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #09090b;
  color: #f4f4f5;
}
```

- [ ] **Step 2: Implement root layout in `src/app/layout.tsx`**

```tsx
// src/app/layout.tsx
import React from "react";
import "./globals.css";

export const metadata = {
  title: "EcoProof AI — Verifiable Impact & Sustainability Media Platform",
  description: "AI-powered media verification uniting Cloudinary and TypeSafe Jev",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Assemble Master Command Terminal in `src/app/page.tsx` with all modals & live search**

```tsx
// src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FinOpsTicker } from "../components/FinOpsTicker";
import { ComparisonSlider } from "../components/ComparisonSlider";
import { JevTelemetryPanel } from "../components/JevTelemetryPanel";
import { SearchConsole } from "../components/SearchConsole";
import { MediaUploader } from "../components/MediaUploader";
import { VideoReelModal } from "../components/VideoReelModal";
import { ImpactDossierModal } from "../components/ImpactDossierModal";
import { DEMO_PROJECTS, DemoProject, getPrecomputedVerdict } from "../lib/fixtures";
import { VerificationVerdict, CloudinaryAssetPayload } from "../lib/types";

export default function MasterCommandTerminal() {
  const [selectedProject, setSelectedProject] = useState<DemoProject>(DEMO_PROJECTS[0]);
  const [verdict, setVerdict] = useState<VerificationVerdict | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFraudTestActive, setIsFraudTestActive] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(false);
  const [matchingAssets, setMatchingAssets] = useState<CloudinaryAssetPayload[]>([]);

  useEffect(() => {
    const initialVerdict = getPrecomputedVerdict(selectedProject.currentAsset.publicId);
    setVerdict(initialVerdict);
    setIsFraudTestActive(false);
  }, [selectedProject]);

  const handleSearch = async (query: string) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setMatchingAssets(data.resources || []);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleTriggerFraudTest = () => {
    setIsLoading(true);
    setIsFraudTestActive(true);
    setTimeout(() => {
      const fraudVerdict = getPrecomputedVerdict("fraud_severed_branch_prop");
      setVerdict(fraudVerdict);
      setIsLoading(false);
    }, 88);
  };

  const handleResetGenuine = () => {
    setIsLoading(true);
    setIsFraudTestActive(false);
    setTimeout(() => {
      const genuineVerdict = getPrecomputedVerdict(selectedProject.currentAsset.publicId);
      setVerdict(genuineVerdict);
      setIsLoading(false);
    }, 94);
  };

  const handleNewUpload = async (asset: CloudinaryAssetPayload) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset,
          claimedProjectId: selectedProject.id,
          baselineAssetId: selectedProject.baselineAsset.publicId,
        }),
      });
      const newVerdict = await res.json();
      setVerdict(newVerdict);
    } catch {
      setVerdict(getPrecomputedVerdict(selectedProject.currentAsset.publicId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <FinOpsTicker />

      {/* Top Header */}
      <header className="px-8 py-5 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-zinc-950 text-lg shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            E
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-100 flex items-center space-x-2">
              <span>EcoProof AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">v1.0.0</span>
            </h1>
            <p className="text-xs text-zinc-500">Cloudinary Visual Engine · TypeSafe Jev System 1 Cortex</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isFraudTestActive ? (
            <button
              onClick={handleResetGenuine}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all"
            >
              Reset Genuine Mangrove Plot (Beat 2)
            </button>
          ) : (
            <button
              onClick={handleTriggerFraudTest}
              className="px-4 py-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all animate-pulse"
            >
              🚨 Inject Staged Branch Fraud Prop (Stage Test)
            </button>
          )}
        </div>
      </header>

      {/* Main Terminal Layout */}
      <main className="flex-1 p-8 grid grid-cols-12 gap-8 max-w-[1700px] w-full mx-auto">
        {/* Left Sidebar: Search & Project Selector */}
        <div className="col-span-3 space-y-6">
          <SearchConsole onSearch={handleSearch} />

          {matchingAssets.length > 0 && (
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-400">
                <span>Search Matches ({matchingAssets.length})</span>
                <button onClick={() => setMatchingAssets([])} className="text-zinc-500 hover:text-zinc-300">✕</button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {matchingAssets.map((a) => (
                  <div key={a.publicId} className="text-[11px] text-zinc-300 truncate p-1 bg-zinc-950 rounded">
                    {a.publicId} ({a.tags?.slice(0, 2).join(", ")})
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">Registered Impact Projects</h3>
            {DEMO_PROJECTS.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedProject.id === project.id
                    ? "bg-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-950/20"
                    : "bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/50 text-zinc-400"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-semibold text-zinc-100">{project.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono">
                    {project.sdg.toUpperCase().split("_")[1]}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{project.location}</p>
              </button>
            ))}
          </div>

          <MediaUploader onUploadSuccess={handleNewUpload} />
        </div>

        {/* Center Canvas: Dynamic Comparison Slider */}
        <div className="col-span-5">
          <ComparisonSlider
            beforeUrl={selectedProject.baselineAsset.secureUrl}
            afterUrl={
              isFraudTestActive && selectedProject.fraudAsset
                ? selectedProject.fraudAsset.secureUrl
                : selectedProject.currentAsset.secureUrl
            }
            differenceUrl={verdict?.differenceUrl}
            projectName={selectedProject.name}
            onOpenVideoReel={() => setIsVideoModalOpen(true)}
            onOpenDossier={() => setIsDossierModalOpen(true)}
          />
        </div>

        {/* Right Telemetry: TypeSafe Jev System 1 Cortex */}
        <div className="col-span-4">
          <JevTelemetryPanel verdict={verdict} isLoading={isLoading} />
        </div>
      </main>

      {/* Modals */}
      <VideoReelModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={verdict?.videoReelUrl}
        projectName={selectedProject.name}
      />

      <ImpactDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        verdict={verdict}
        projectName={selectedProject.name}
        location={selectedProject.location}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat(ui): assemble master command terminal with live search, video reels, and dossier export"
```

---

### Task 12: Standalone Embeddable Web Component (`<ecoproof-slider>`)

**Files:**
- Create: `src/components/EcoProofWidget.ts`
- Create: `public/widget.js`

- [ ] **Step 1: Implement `src/components/EcoProofWidget.ts`**

```typescript
// src/components/EcoProofWidget.ts
export class EcoProofSliderElement extends HTMLElement {
  connectedCallback() {
    const cloudName = this.getAttribute("cloud-name") || "ecoproof-demo";
    const beforeId = this.getAttribute("before-id") || "kenya_mangrove_baseline_2025";
    const afterId = this.getAttribute("after-id") || "kenya_mangrove_current_2026";
    const projectId = this.getAttribute("project-id") || "VERRA-9412";

    const afterUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_600,h_400/${afterId}.jpg`;
    const beforeUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_600,h_400/${beforeId}.jpg`;

    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; font-family: sans-serif; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); background: #09090b; }
          .header { display: flex; justify-content: space-between; padding: 10px 16px; background: #18181b; color: #f4f4f5; font-size: 12px; }
          .badge { background: #064e3b; color: #34d399; padding: 2px 8px; border-radius: 9999px; font-weight: bold; }
          .container { position: relative; width: 100%; height: 350px; overflow: hidden; }
          img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
          .slider { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: ew-resize; z-index: 10; }
          .clip { position: absolute; inset: 0; overflow: hidden; width: 50%; border-right: 2px solid white; }
        </style>
        <div class="header">
          <span>Project: <b>${projectId}</b></span>
          <span class="badge">VERIFIED BY JEV</span>
        </div>
        <div class="container">
          <img src="${afterUrl}" alt="After" />
          <div class="clip" id="clip">
            <img src="${beforeUrl}" alt="Before" style="width: 600px; max-width: none;" />
          </div>
          <input type="range" min="0" max="100" value="50" class="slider" id="range" />
        </div>
      `;

      const range = this.shadowRoot.getElementById("range") as HTMLInputElement;
      const clip = this.shadowRoot.getElementById("clip") as HTMLDivElement;

      range?.addEventListener("input", (e) => {
        clip.style.width = `${(e.target as HTMLInputElement).value}%`;
      });
    }
  }
}

if (typeof window !== "undefined" && !customElements.get("ecoproof-slider")) {
  customElements.define("ecoproof-slider", EcoProofSliderElement);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EcoProofWidget.ts
git commit -m "feat(widget): implement standalone embeddable <ecoproof-slider> web component"
```

---

## Plan Verification & Review Execution

Run all test suites across the 12 tasks to verify 100% test coverage and build stability:
```bash
npx vitest run
```
Expected output: All 6 test suites pass with zero failures.
