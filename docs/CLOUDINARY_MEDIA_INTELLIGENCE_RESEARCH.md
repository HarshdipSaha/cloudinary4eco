# Research notes: Cloudinary media intelligence and AI capabilities
**Project:** AI-Powered Impact & Sustainability Media Platform (Problem Statement 02 - Cloudinary)  
**Date:** September 2026  
**Audience:** Full-Stack Engineers, AI Architects, M&E Specialists, and Hackathon Judges

> **Research proposal, not an implementation guide.** This document discusses media capabilities and possible designs; it does not describe features shipped in SAAKSHYA. For current account and code behavior, use the [verified Cloudinary integration guide](CLOUDINARY.md) and [current specification](SPECIFICATION_DOCUMENT.md).

---

## Table of Contents
1. [Overview & Platform Value Proposition](#1-overview--platform-value-proposition)
2. [Multi-Model AI Content Analysis & Add-Ons](#2-multi-model-ai-content-analysis--add-ons)
3. [Optical Character Recognition (OCR) for ESG Compliance](#3-optical-character-recognition-ocr-for-esg-compliance)
4. [AI-Powered Generative Image Captioning & Accessibility](#4-ai-powered-generative-image-captioning--accessibility)
5. [AI Video Intelligence, Summarization & Highlight Generation](#5-ai-video-intelligence-summarization--highlight-generation)
6. [Dynamic Transformations for Visual Juxtaposition & Change Detection](#6-dynamic-transformations-for-visual-juxtaposition--change-detection)
7. [Eco-Conscious Media Delivery & Digital Carbon Minimization](#7-eco-conscious-media-delivery--digital-carbon-minimization)
8. [Digital Asset Management (DAM): Structured Metadata & Search API](#8-digital-asset-management-dam-structured-metadata--search-api)
9. [Direct-to-Cloud Upload Workflows & Presets](#9-direct-to-cloud-upload-workflows--presets)
10. [Asynchronous Webhooks, Lifecycle Events & HMAC Verification](#10-asynchronous-webhooks-lifecycle-events--hmac-verification)
11. [C2PA Content Credentials & Media Provenance (`fl_c2pa`)](#11-c2pa-content-credentials--media-provenance-fl_c2pa)
12. [Cloudinary SDK Implementation Blueprints (Node.js & Python)](#12-cloudinary-sdk-implementation-blueprints-nodejs--python)

---

## 1. Overview & Platform Value Proposition

In environmental conservation, carbon verification, and humanitarian initiatives, field media is the primary ground-truth currency. However, organizations struggle with raw, uncurated photo and video dumps that lack verification, standardized categorization, and visual comparators.

**Cloudinary** functions as the unified visual intelligence layer and dynamic media engine. It solves this challenge through:
- **Zero-Compute Ingestion**: Field workers upload high-res images and 4K videos directly to Cloudinary edge nodes, bypassing application servers.
- **Automated Saliency & Content Categorization**: Native integration of Google Vision AI, Amazon Rekognition, and Cloudinary AI for automatic environmental tagging and object detection.
- **Dynamic On-the-Fly Composition**: Generating side-by-side before/after comparisons, difference heatmaps, and highlight reels purely via URL parameters without CPU-heavy FFmpeg rendering.
- **Financial-Grade Auditability**: Cryptographic metadata preservation, typed structured metadata for ESG targets, and native C2PA provenance tracking (`fl_c2pa`).

---

## 2. Multi-Model AI Content Analysis & Add-Ons

Cloudinary incorporates leading vision models directly into its upload and admin pipelines via the `categorization` and `auto_tagging` APIs.

### 2.1 Multi-Engine Add-On Matrix
| Add-on Identifier | Model Provider | Primary Specialty in Environmental Impact | Confidence Range |
| :--- | :--- | :--- | :--- |
| `google_tagging` | Google Cloud Vision AI | Landscape classification (`wetland`, `mangrove`, `canopy`, `arid land`), biodiversity flora/fauna taxonomy, geographical landmarks. | `0.0` to `1.0` (Default: `0.5`) |
| `aws_rek_tagging` | Amazon Rekognition | Physical infrastructure (`solar panel`, `wind turbine`, `water pump`, `polypropylene bag`, `concrete foundation`), hazard/safety detection. | `0.0` to `1.0` |
| `cld_tagging` | Cloudinary AI Vision | Visual similarity matching, contextual scene classification, automated color palette extraction. | `0.0` to `1.0` |
| `imagga_tagging` | Imagga Technologies | Multi-category thematic classification and color harmony indexing. | `0.0` to `1.0` |

### 2.2 Upload Parameters & Automated Tagging
- **`categorization`**: Comma-delimited list of engines to run upon asset intake.
- **`auto_tagging`**: Floating-point threshold (e.g., `0.70`). Detected categories exceeding this score are automatically injected into the asset’s top-level searchable `tags` array.

#### Example Upload Request (Node.js SDK)
```javascript
const result = await cloudinary.v2.uploader.upload("field_solar_pump.jpg", {
  folder: "impact_projects/kenya_water/raw",
  categorization: "google_tagging,aws_rek_tagging",
  auto_tagging: 0.70,
  notification_url: "https://api.platform.org/webhooks/cloudinary"
});
```

#### Webhook Response Payload (`info.categorization`)
```json
{
  "tags": ["Solar Energy", "Photovoltaic", "Water Pump", "Arid Soil"],
  "info": {
    "categorization": {
      "google_tagging": {
        "status": "complete",
        "data": {
          "Solar panel": 0.94,
          "Water borehole": 0.88,
          "Savanna": 0.82
        }
      },
      "aws_rek_tagging": {
        "status": "complete",
        "data": {
          "Photovoltaic Module": 0.96,
          "Pump": 0.91,
          "Rural Area": 0.89
        }
      }
    }
  }
}
```

---

## 3. Optical Character Recognition (OCR) for ESG Compliance

Auditing field projects requires verifying physical inscriptions: meter readings, Gold Standard / Verra certificate numbers, borehole serial numbers, equipment nameplates, and local project signs.

### 3.1 OCR Add-On Parameters
- **`ocr: "adv_ocr"`**: General environmental text, machinery nameplates, and signage.
- **`ocr: "adv_ocr:document"`**: High-density document parsing, PDF carbon audit reports, and multi-column invoices.

### 3.2 Output Payload & Extraction
Cloudinary returns full text annotations along with 4-point bounding polygons for every detected word:
```json
{
  "info": {
    "ocr": {
      "adv_ocr": {
        "status": "complete",
        "data": [
          {
            "textAnnotations": [
              {
                "description": "PROJECT ID: VERRA-9412\nBOREHOLE DEPTH: 140M\nCOMMISSIONED: 2026-04-12",
                "locale": "en",
                "boundingPoly": {
                  "vertices": [{"x": 120, "y": 80}, {"x": 840, "y": 80}, {"x": 840, "y": 420}, {"x": 120, "y": 420}]
                }
              }
            ]
          }
        ]
      }
    }
  }
}
```

---

## 4. AI-Powered Generative Image Captioning & Accessibility

To comply with accessibility mandates (WCAG 2.1 AA) and enable rich semantic discovery without manual description entry, Cloudinary provides automated multimodal image captioning.

- **Upload Parameter**: `detection: "captioning"`
- **Model Output**: Generates human-grade descriptive captions stored under `info.detection.captioning.data.caption`.
- **Automated Alt-Tag Synchronization**:
  ```javascript
  // Webhook handler auto-populates contextual alt tag
  if (webhookBody.info?.detection?.captioning?.data?.caption) {
    const autoCaption = webhookBody.info.detection.captioning.data.caption;
    await cloudinary.v2.uploader.explicit(webhookBody.public_id, {
      type: "upload",
      context: `alt=${autoCaption}|caption=${autoCaption}`
    });
  }
  ```

---

## 5. AI Video Intelligence, Summarization & Highlight Generation

Field surveys produce hours of drone flyover and camera-trap footage. Cloudinary transforms these heavy video streams into concise donor and stakeholder highlights.

### 5.1 AI Video Preview Generation (`e_preview`)
The `e_preview` effect evaluates frame visual entropy, camera motion, and object significance to extract the most compelling clips:
- **Syntax**: `e_preview:duration_<sec>:max_seg_<count>:min_seg_dur_<sec>`
- **Example URL**:
  ```
  https://res.cloudinary.com/impact-cloud/video/upload/e_preview:duration_15:max_seg_4:min_seg_dur_3/c_fill,ar_9:16,w_1080,h_1920,g_auto/field_drone_patrol.mp4
  ```
  *Result*: Automatically produces a 15-second teaser containing the 4 most salient video clips, reframed to 9:16 vertical video for mobile social reels.

### 5.2 Speech-to-Text Subtitle Generation
- **Parameter**: `raw_convert: "google_speech:vtt"` or `"google_speech:srt"`
- **Execution**: Extracts audio from field interviews, runs speech-to-text transcription, and generates a `.vtt` file under the same public ID.
- **Dynamic Subtitle Burning**:
  ```
  https://res.cloudinary.com/impact-cloud/video/upload/l_subtitles:field_drone_patrol.vtt/co_white,g_south,y_120,fl_layer_apply/field_drone_patrol.mp4
  ```

---

## 6. Dynamic Transformations for Visual Juxtaposition & Change Detection

Instead of maintaining expensive video render farms or pre-generating thousands of image composites, Cloudinary renders before/after assets on demand through URL chaining.

### 6.1 Side-by-Side Comparison (Montage Canvas)
Juxtaposes a baseline "Before" image and an outcome "After" image onto a unified canvas:
1. Base image (`before_site`) resized to standard dimensions: `c_fill,w_600,h_600`.
2. Expand canvas width to 1200px and anchor base image to West: `c_pad,w_1200,h_600,g_west,b_rgb:0f172a`.
3. Overlay `after_site` anchored to East: `l_after_site/c_fill,w_600,h_600/fl_layer_apply,g_east`.
4. Render text chips (`BEFORE` and `AFTER`):

```
https://res.cloudinary.com/impact-cloud/image/upload/
  c_fill,w_600,h_600/
  c_pad,w_1200,h_600,g_west,b_rgb:111827/
  l_after_site/c_fill,w_600,h_600/fl_layer_apply,g_east/
  l_text:Arial_22_bold:BEFORE/co_rgb:ffffff,b_rgb:000000a0,y_25,x_25,g_north_west/fl_layer_apply/
  l_text:Arial_22_bold:AFTER/co_rgb:ffffff,b_rgb:10b981d0,y_25,x_25,g_north_east/fl_layer_apply/
  f_auto,q_auto/before_site.jpg
```

### 6.2 Pixel-Precision Difference Blending (`e_difference`)
Calculates the absolute pixel difference $|I_{after} - I_{before}|$:
- Unchanged terrain renders as pure black.
- Newly planted saplings, structures, or clear-cuts glow brightly in contrast.
```
https://res.cloudinary.com/impact-cloud/image/upload/
  c_fill,w_800,h_600/
  l_after_site/c_fill,w_800,h_600/e_difference/fl_layer_apply/
  f_auto,q_auto/before_site.jpg
```

### 6.3 Video Concatenation & Transitions (`fl_splice`)
Splices multiple video clips with automated transitions:
```
https://res.cloudinary.com/impact-cloud/video/upload/
  c_fill,ar_9:16,w_1080,h_1920/
  l_video:after_clip/c_fill,ar_9:16,w_1080,h_1920/
  fl_splice:transition_(name_fade;du_1.5),fl_layer_apply/
  before_clip.mp4
```

---

## 7. Eco-Conscious Media Delivery & Digital Carbon Minimization

Digital data transfer contributes directly to global greenhouse emissions (~0.5g to 1.5g CO2e per GB transferred). Cloudinary provides algorithmic optimization to minimize digital footprints:

*   **`f_auto`**: Automatically negotiates the most compressed modern image format supported by the user's browser (AVIF, WebP, JPEG-XL).
*   **`q_auto:eco`**: Applies perceptual compression tuned specifically to maximize byte savings with zero noticeable visual degradation on mobile and desktop screens.
*   **`dpr_auto`**: Delivers resolution matched to the client screen density, preventing wasteful 3x retina downloads on 1x/2x screens.
*   **Impact**: Combining `f_auto,q_auto:eco` slashes payload size by **65%–78%** compared to standard uncompressed JPEGs.

---

## 8. Digital Asset Management (DAM): Structured Metadata & Search API

### 8.1 Structured Metadata vs Contextual Metadata vs Tags
- **Tags**: Free-form array of strings (`tags: ["mangrove", "reforestation"]`).
- **Contextual Metadata**: Custom key-value pairs stored per asset (`context: { photographer: "John Doe", device: "DJI Mavic 3" }`).
- **Structured Metadata**: Globally administered, strongly-typed schema with validation rules and search indices.

### 8.2 Defining Structured Metadata for Problem Statement 02
```javascript
// 1. Carbon Offset Metric (Integer)
await cloudinary.v2.api.add_metadata_field({
  external_id: "carbon_offset_tco2e",
  label: "Carbon Offset (tCO2e)",
  type: "integer"
});

// 2. UN Sustainable Development Goals (Multi-Select Set)
await cloudinary.v2.api.add_metadata_field({
  external_id: "un_sdg_goals",
  label: "UN SDG Goals",
  type: "set",
  datasource: {
    values: [
      { external_id: "sdg_6", value: "SDG 6: Clean Water" },
      { external_id: "sdg_13", value: "SDG 13: Climate Action" },
      { external_id: "sdg_15", value: "SDG 15: Life on Land" }
    ]
  }
});

// 3. Verification Audit Status (Enum)
await cloudinary.v2.api.add_metadata_field({
  external_id: "audit_status",
  label: "ESG Audit Status",
  type: "enum",
  datasource: {
    values: [
      { external_id: "pending", value: "Pending AI Audit" },
      { external_id: "verified", value: "Auditor Verified" },
      { external_id: "flagged", value: "Flagged Discrepancy" }
    ]
  }
});
```

### 8.3 Executing Complex Queries via Search API
```javascript
const searchResults = await cloudinary.v2.search
  .expression('tags:reforestation AND metadata.audit_status=verified AND metadata.carbon_offset_tco2e>=50')
  .sort_by('created_at', 'desc')
  .max_results(25)
  .execute();
```

---

## 9. Direct-to-Cloud Upload Workflows & Presets

### 9.1 Upload Presets
Upload presets centralize rules for tagging, OCR, moderation, and transformations:
```javascript
await cloudinary.v2.api.create_upload_preset({
  name: "field_ranger_upload_preset",
  unsigned: false, // Signed preset for security
  folder: "field_intake/raw",
  categorization: "google_tagging,aws_rek_tagging",
  auto_tagging: 0.65,
  ocr: "adv_ocr",
  detection: "captioning",
  notification_url: "https://api.platform.org/webhooks/cloudinary",
  eager: [
    { transformation: [{ width: 400, height: 300, crop: "fill", gravity: "auto" }] }
  ]
});
```

### 9.2 Client-Side Chunked Uploads for Remote Areas
For video files > 10MB captured in low-bandwidth field zones:
- Chunk size: 5 MB minimum slices.
- Header `X-Unique-Upload-Id`: Persisted UUID across retries.
- Header `Content-Range`: Tracks current byte position (`bytes 0-5242879/24000000`).

---

## 10. Asynchronous Webhooks, Lifecycle Events & HMAC Verification

Because multi-model AI analysis and video transformations execute asynchronously, Cloudinary dispatches secure webhooks upon job completion.

### 10.1 Webhook Signature Validation (Node.js)
```typescript
import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

export function handleCloudinaryWebhook(req: Request, res: Response) {
  const timestamp = req.headers['x-cld-timestamp'] as string;
  const signature = req.headers['x-cld-signature'] as string;
  const payloadString = JSON.stringify(req.body);

  // Validate HMAC signature (max tolerance: 5 minutes)
  const isValid = cloudinary.utils.verifyNotificationSignature(
    payloadString,
    parseInt(timestamp, 10),
    signature,
    300
  );

  if (!isValid) {
    return res.status(401).send("Invalid HMAC Signature");
  }

  const { notification_type, public_id, info } = req.body;
  console.log(`Received Cloudinary ${notification_type} event for ${public_id}`);

  // Process AI tags, OCR results, and auto-captions
  res.status(200).json({ status: "acknowledged" });
}
```

---

## 11. C2PA Content Credentials & Media Provenance (`fl_c2pa`)

To satisfy strict donor transparency and prevent greenwashing, media assets can be authenticated using the **Coalition for Content Provenance and Authenticity (C2PA)** open standard:

- **Flag**: `fl_c2pa`
- **Behavior**: Cloudinary inspects incoming media for C2PA cryptographic manifests. When transformations (cropping, watermarking, format conversion) are performed, Cloudinary appends an updated, cryptographically signed transformation manifest.
- **Delivery**: Assets served with `fl_c2pa` allow viewers and auditors to click the Content Credentials pin (via `@contentauth/c2pa-web`) to inspect the original capture device, GPS coordinates, editing history, and cryptographic signatures.

---

## 12. Cloudinary SDK Implementation Blueprints (Node.js & Python)

### 12.1 Backend Upload Signer (FastAPI / Python)
```python
import time
import cloudinary.utils

def generate_signed_upload_params(project_id: str, user_id: str):
    timestamp = int(time.time())
    params_to_sign = {
        "folder": f"impact_projects/{project_id}",
        "timestamp": timestamp,
        "context": f"project_id={project_id}|uploader_id={user_id}",
        "notification_url": "https://api.platform.org/webhooks/cloudinary"
    }
    signature = cloudinary.utils.api_sign_request(params_to_sign, CLOUDINARY_API_SECRET)
    return {
        "signature": signature,
        "timestamp": timestamp,
        "api_key": CLOUDINARY_API_KEY,
        "cloud_name": CLOUDINARY_CLOUD_NAME,
        "folder": params_to_sign["folder"]
    }
```

### 12.2 Next.js React Component (Interactive Comparison Viewer)
```tsx
import React, { useState } from 'react';

export const ImpactComparisonViewer = ({ beforePublicId, afterPublicId, cloudName }: {
  beforePublicId: string;
  afterPublicId: string;
  cloudName: string;
}) => {
  const [sliderPos, setSliderPos] = useState(50);

  // Cloudinary optimized responsive URLs
  const beforeUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_1200,h_800,g_auto/f_auto,q_auto:eco/${beforePublicId}`;
  const afterUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_1200,h_800,g_auto/f_auto,q_auto:eco/${afterPublicId}`;

  return (
    <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl shadow-xl select-none">
      <img src={beforeUrl} alt="Before Intervention" className="absolute inset-0 w-full h-full object-cover" />
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
      >
        <img src={afterUrl} alt="After Intervention" className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
      />
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none z-10"
        style={{ left: `${sliderPos}%` }}
      />
    </div>
  );
};
```
