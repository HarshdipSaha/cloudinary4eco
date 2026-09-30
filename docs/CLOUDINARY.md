# SAAKSHYA Cloudinary integration

This guide describes the Cloudinary adapter currently in `web/src/adapters/cloudinary/`. It is an implementation reference, not a roadmap. Cloudinary provides media upload, storage, selected metadata, URL transformations, and structured asset lookup. SAAKSHYA's Python/OpenCV worker performs image registration and change measurement.

## Current integration

| Capability | Implemented behavior | Boundary |
|---|---|---|
| Browser image upload | The server signs a direct upload with `image_metadata=true`, `phash=true`, and `faces=true`, plus the destination folder and optional context. The browser sends the exact signed parameters to Cloudinary. | The adapter does not request Cloudinary AI captioning, auto-tagging, or OCR add-ons. |
| Asset analysis | Resource lookup requests image metadata, perceptual hash, face data, tags, and context. The adapter extracts available capture time/GPS, a valid 64-bit pHash, face count, tags, and optional caption/OCR fields if Cloudinary returns them. Missing signals remain missing. | A saved account probe records captioning, Google tagging, AWS Rekognition tagging, Cloudinary tagging, and advanced OCR as unavailable because the required subscriptions are inactive. Do not describe these as enabled features. |
| Public image delivery | `publicPlate` and the side-by-side/social URL helpers apply Cloudinary's `e_pixelate_faces:20`, `f_auto`, and `q_auto` transformations. | These helpers only protect views that use them. Do not claim every public image or every route is automatically redacted. |
| Image composition | The URL helpers can compose a before/after side-by-side image and square, portrait, or 4:5 social crops from image assets. | This is image compositing and cropping. It is not a video reel or video-splicing pipeline. |
| Public video import | The adapter imports a permitted public Cloudinary video URL, reads its duration, and renders still images at three offsets (10%, 50%, and 90% of the duration). Those stills enter the normal evidence-ingest path. | This does not analyze the whole video, extract audio, create a timelapse, reframe video, or splice clips. Imported frame evidence has no trusted EXIF GPS or capture time. |
| Structured media search | `searchIds` executes a Cloudinary search expression and returns matching public IDs. | This is structured candidate retrieval, not natural-language or semantic search. The media port explicitly supports filters only; SAAKSHYA's application search can apply its own ranking. |
| Original and derived media | Cloudinary stores uploaded media and serves transformation URLs. | It does not perform SAAKSHYA's local registration or change measurement. The Python/OpenCV worker computes alignment, registration quality, metrics, aligned images, and difference images; those derivatives are associated with their source evidence in SAAKSHYA. |

## Metadata and integrity limits

The adapter reads GPS and capture time from metadata when present and parses a pHash for duplicate checks. It records missing values instead of inventing them. EXIF values can be absent or edited; they are useful signals, not cryptographic provenance or legal proof of where and when a photograph was taken. A pHash is a similarity signal, not proof that two images depict the same event.

The `faces` upload parameter and public pixelation transform are separate behaviors: Cloudinary supplies face data to the adapter, while pixelation occurs only in URL helpers that request the transform. Review each public image surface before claiming it is anonymized.

## Verified implementation references

- Upload parameters, resource analysis, video import/frame rendering, and Cloudinary search: `web/src/adapters/cloudinary/gateway.ts`
- Optional caption/OCR parsing, metadata, pHash, face count, and missing-signal tracking: `web/src/adapters/cloudinary/analysis.ts`
- Image delivery, composition, face pixelation, and social crops: `web/src/adapters/cloudinary/urls.ts`
- Evidence ingestion and Python registration port: `web/src/pipeline/ingest.ts` and `web/src/ports/registration.ts`
- Public video frame extraction and normal evidence ingestion: `web/src/pipeline/public-video.ts`
- Saved account capability probe: `web/src/test/fixtures/cloudinary/probe-report.json`

## Not currently supported by this adapter

Cloudinary OCR or AI caption/tagging add-ons, C2PA signing, Cloudinary pixel-difference analysis, whole-video understanding, video reframing or splicing, and automatic privacy guarantees across every public route are not implemented capabilities. The local OpenCV worker is part of the product's image-processing path; the claim "zero local image processing" would be inaccurate.
