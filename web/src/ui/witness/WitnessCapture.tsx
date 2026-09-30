"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cld } from "@/ui/cld";
import { toEdges, alignmentScore } from "./align";
import { saveToOutbox, flushOutbox } from "./outbox";
import type { LatLon } from "@/domain/types";
import { Camera, RefreshCw, Send, CheckCircle2, ShieldCheck, Sliders } from "lucide-react";

export function WitnessCapture({
  site,
  gradeLabel,
  seededSampleUrl,
}: {
  site: {
    id: string;
    slug: string;
    name: string;
    baselineAssetId: string | null;
  };
  gradeLabel?: string;
  seededSampleUrl?: string;
}) {
  const [phase, setPhase] = useState<"intro" | "camera" | "confirm" | "done" | "offline_saved">("intro");
  const [ghostOpacity, setGhostOpacity] = useState<number>(0.35);
  const [showOpacitySlider, setShowOpacitySlider] = useState<boolean>(false);
  const [alignPercent, setAlignPercent] = useState<number>(0);
  const [cameraError, setCameraError] = useState<boolean>(false);

  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentGrade, setCurrentGrade] = useState<string | null>(gradeLabel ?? null);
  const [submittedRecord, setSubmittedRecord] = useState<{
    assetId: string;
    status: string;
    statusReason: string | null;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const ghostCanvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);
  const ghostEdgesRef = useRef<Float32Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ghostUrl = site.baselineAssetId ? cld.ghost(site.baselineAssetId, 720) : null;

  // Flush outbox when online
  useEffect(() => {
    flushOutbox();
    function handleOnline() {
      flushOutbox();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // Precompute ghost edges (64x48) when ghostUrl is present
  useEffect(() => {
    if (!ghostUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = ghostUrl;
    img.onload = () => {
      const cvs = ghostCanvasRef.current ?? document.createElement("canvas");
      cvs.width = 64;
      cvs.height = 48;
      const ctx = cvs.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 64, 48);
      const imgData = ctx.getImageData(0, 0, 64, 48);
      ghostEdgesRef.current = toEdges(imgData.data, 64, 48);
    };
  }, [ghostUrl]);

  // Start camera stream
  async function startCamera() {
    setCameraError(false);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        // No rear camera (e.g. a laptop webcam) — fall back to whatever camera exists
        // instead of giving up on the live viewfinder entirely.
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      setPhase("camera");
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraError(true);
      setPhase("camera");
    }
  }

  // Periodic alignment check loop
  useEffect(() => {
    if (phase !== "camera" || cameraError) return;
    const interval = setInterval(() => {
      if (!videoRef.current || !ghostEdgesRef.current || videoRef.current.readyState < 2) return;
      const cvs = sampleCanvasRef.current ?? document.createElement("canvas");
      cvs.width = 64;
      cvs.height = 48;
      const ctx = cvs.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, 64, 48);
      const data = ctx.getImageData(0, 0, 64, 48);
      const sampleEdges = toEdges(data.data, 64, 48);
      const score = alignmentScore(ghostEdgesRef.current, sampleEdges);
      const pct = Math.max(0, Math.min(100, Math.round(score * 100)));
      setAlignPercent(pct);
    }, 400);

    return () => clearInterval(interval);
  }, [phase, cameraError]);

  // Capture current frame
  function takeSnapshot() {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const cvs = document.createElement("canvas");
    cvs.width = v.videoWidth || 1280;
    cvs.height = v.videoHeight || 720;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, cvs.width, cvs.height);

    cvs.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        // Stop video tracks
        const stream = v.srcObject as MediaStream;
        stream?.getTracks().forEach((t) => t.stop());
        setPhase("confirm");
      },
      "image/jpeg",
      0.9
    );
  }

  // Handle fallback file capture (<input type="file" capture="environment">)
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPhase("confirm");
  }

  async function loadSeededSample() {
    if (!seededSampleUrl) return;
    const response = await fetch(seededSampleUrl);
    if (!response.ok) return;
    const blob = await response.blob();
    setCapturedBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setComment("Seeded walkthrough control: re-uploaded Plot B follow-up test image; not independent field testimony.");
    setPhase("confirm");
  }

  // Submit capture
  async function submitWitness() {
    if (!capturedBlob) return;
    setSubmitting(true);

    // 1. Get browser GPS if permitted
    let gps: LatLon | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
      });
      gps = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    } catch {
      // GPS not granted or timed out
    }

    // 2. Try direct upload & witness POST
    if (navigator.onLine) {
      try {
        const sigRes = await fetch("/api/uploads/sign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ siteSlug: site.slug }),
        });
        if (!sigRes.ok) throw new Error("Sign failed");
        const sig = await sigRes.json();

        const form = new FormData();
        form.append("file", capturedBlob, `witness_${Date.now()}.jpg`);
        for (const [k, v] of Object.entries(sig.params as Record<string, string>)) {
          form.append(k, v);
        }
        form.append("api_key", sig.apiKey);
        form.append("signature", sig.signature);

        const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
          method: "POST",
          body: form,
        });
        if (!upRes.ok) throw new Error("Cloudinary upload failed");
        const upData = await upRes.json();

        const witRes = await fetch(`/api/witness/${site.slug}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            assetId: upData.public_id,
            comment: comment.trim() || undefined,
            gps,
          }),
        });

        if (!witRes.ok) throw new Error("Witness ingest failed");
        const witData = await witRes.json();
        if (witData.latestGrade) setCurrentGrade(`Grade ${witData.latestGrade}`);
        setSubmittedRecord({
          assetId: witData.assetId,
          status: witData.status,
          statusReason: witData.statusReason ?? null,
        });
        setPhase("done");
        return;
      } catch (err) {
        console.warn("Direct upload failed, saving to offline outbox:", err);
      }
    }

    // If offline or upload failed, save to IndexedDB outbox
    await saveToOutbox({
      blob: capturedBlob,
      slug: site.slug,
      comment: comment.trim() || undefined,
      gps,
      createdAt: new Date().toISOString(),
    });
    setPhase("offline_saved");
    setSubmitting(false);
  }

  // --- PHASE 1: INTRO ---
  if (phase === "intro") {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-paper p-6 text-paper-ink">
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-2 text-paper-ink-muted text-[13px] font-mono">
            <ShieldCheck className="h-4 w-4 text-measure" />
            <span>SAAKSHYA WITNESS</span>
          </div>

          <h1 className="font-serif text-[28px] font-bold leading-tight tracking-tight">
            {site.name}
          </h1>

          <p className="text-[16px] leading-relaxed text-paper-ink-muted">
            Help keep this project honest. Stand where the faint outline lines up and take one photo.
          </p>

          <div className="rounded-[4px] border border-paper-line bg-paper-surface p-4 text-[13px] text-paper-ink-muted">
            Selected public image views use Cloudinary face pixelation. Redaction is not guaranteed on every route; avoid submitting sensitive images.
          </div>

          {seededSampleUrl && (
            <div className="rounded-[4px] border border-paper-line bg-paper-surface p-4 text-[13px] text-paper-ink-muted">
              <span className="font-semibold text-paper-ink">Seeded test control: </span>
              This reuses the Plot B follow-up fixture and can trigger a duplicate flag. It is not an independent field observation.
              <button
                type="button"
                onClick={loadSeededSample}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-[4px] border border-paper-line bg-paper px-3 text-[12px] font-semibold text-paper-ink hover:bg-paper-surface"
              >
                Use seeded test image
              </button>
            </div>
          )}

          {ghostUrl && (
            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-paper-ink-muted block">
                Reference framing
              </span>
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-[4px] border border-paper-line bg-paper-surface">
                <img
                  src={ghostUrl}
                  alt="Reference angle"
                  className="h-full w-full object-cover opacity-80"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pb-6 pt-8">
          <button
            onClick={startCamera}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-measure px-4 text-base font-semibold text-measure-ink shadow-md transition-opacity hover:opacity-90 active:scale-[0.99]"
          >
            <Camera className="h-5 w-5" />
            <span>Start camera</span>
          </button>
        </div>
      </div>
    );
  }

  // --- PHASE 2: CAMERA VIEW ---
  if (phase === "camera") {
    if (cameraError) {
      return (
        <div className="flex min-h-screen flex-col justify-between bg-paper p-6 text-paper-ink">
          <div className="space-y-6 pt-6">
            <h2 className="font-serif text-2xl font-bold">Camera fallback</h2>
            <p className="text-[14px] text-paper-ink-muted">
              Live viewfinder unavailable. Use your camera directly to take one photo matching the angle below:
            </p>

            {ghostUrl && (
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-[4px] border border-paper-line">
                <img src={ghostUrl} alt="Baseline ghost" className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          <div className="pb-6 space-y-3">
            {/* Request the device camera when the live viewfinder is unavailable. */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileInput}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-measure text-base font-semibold text-measure-ink"
            >
              <Camera className="h-5 w-5" />
              <span>Take photo with camera</span>
            </button>
            <button
              onClick={() => setPhase("intro")}
              className="h-10 w-full text-[13px] text-paper-ink-muted"
            >
              Back
            </button>
          </div>
        </div>
      );
    }

    const isAligned = alignPercent >= 60;

    return (
      <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-black select-none">
        {/* Hidden canvases for Sobel computation */}
        <canvas ref={ghostCanvasRef} className="hidden" />
        <canvas ref={sampleCanvasRef} className="hidden" />

        {/* Live video */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Ghost overlay */}
        {ghostUrl && (
          <img
            src={ghostUrl}
            alt="Ghost overlay"
            style={{ opacity: ghostOpacity }}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover mix-blend-screen transition-opacity"
          />
        )}

        {/* Top Alignment Bar */}
        <div className="absolute top-0 inset-x-0 z-20 bg-linear-to-b from-black/80 to-transparent p-4">
          <div className="mx-auto max-w-md space-y-2">
            <div className="flex items-center justify-between text-white text-[12px] font-mono">
              <span className={isAligned ? "text-measure font-bold" : "text-white/80"}>
                {isAligned ? "Aligned: take the photo" : `Line up the view · ${alignPercent}%`}
              </span>
              <button
                onClick={() => setShowOpacitySlider(!showOpacitySlider)}
                className="flex items-center gap-1 rounded bg-white/20 px-2 py-1 text-[11px]"
              >
                <Sliders className="h-3 w-3" />
                <span>Ghost {Math.round(ghostOpacity * 100)}%</span>
              </button>
            </div>

            {/* Meter Bar */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className={`h-full transition-all duration-300 ${
                  isAligned ? "bg-measure" : "bg-white/60"
                }`}
                style={{ width: `${alignPercent}%` }}
              />
            </div>

            {/* Opacity slider toggle */}
            {showOpacitySlider && (
              <div className="rounded bg-black/70 p-2 mt-2">
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={ghostOpacity}
                  onChange={(e) => setGhostOpacity(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Shutter Bar */}
        <div className="absolute bottom-0 inset-x-0 z-20 flex h-28 items-center justify-center bg-linear-to-t from-black/80 to-transparent pb-4">
          <button
            onClick={takeSnapshot}
            aria-label="Take photo"
            className="flex h-[72px] w-[72px] cursor-pointer items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform active:scale-90"
          >
            <div className="h-14 w-14 rounded-full bg-white" />
          </button>
        </div>
      </div>
    );
  }

  // --- PHASE 3: CONFIRM & COMMENT ---
  if (phase === "confirm") {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-paper p-6 text-paper-ink">
        <div className="space-y-4 pt-4">
          <h2 className="font-serif text-2xl font-bold">Confirm photo</h2>

          {previewUrl && (
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-[4px] border border-paper-line bg-black">
              <img src={previewUrl} alt="Captured preview" className="h-full w-full object-contain" />
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-paper-ink-muted mb-1.5">
              What do you see? (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g., Saplings are healthy, fence is intact..."
              rows={3}
              className="w-full rounded-[4px] border border-paper-line bg-paper-surface p-3 text-[14px] text-paper-ink placeholder:text-paper-ink-muted focus:border-measure focus:outline-hidden"
            />
          </div>
        </div>

        <div className="pb-6 pt-4 space-y-3">
          <button
            onClick={submitWitness}
            disabled={submitting}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-measure text-base font-semibold text-measure-ink shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            <span>{submitting ? "Sending..." : "Submit Photo"}</span>
          </button>
          <button
            onClick={() => {
              setCapturedBlob(null);
              setPreviewUrl(null);
              startCamera();
            }}
            disabled={submitting}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-paper-line text-[14px] font-medium text-paper-ink hover:bg-paper-surface"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retake</span>
          </button>
        </div>
      </div>
    );
  }

  // --- PHASE 4: DONE (THANK YOU) ---
  if (phase === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper p-6 text-center text-paper-ink">
        <CheckCircle2 className="h-16 w-16 text-measure mb-4" />
        <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">Received!</h1>
        <p className="max-w-xs text-[15px] text-paper-ink-muted mb-6">
          Thank you. Your submission has been received by the evidence pipeline.
        </p>

        {submittedRecord && (
          <div className="mb-6 w-full max-w-sm rounded-[4px] border border-paper-line bg-paper-surface p-4 text-left">
            <div className="font-mono text-[11px] uppercase tracking-wider text-paper-ink-muted">Witness record</div>
            <div className="mt-1 font-semibold text-paper-ink">{submittedRecord.status.replaceAll("_", " ")}</div>
            {submittedRecord.statusReason && (
              <p className="mt-1 text-[12px] text-paper-ink-muted">{submittedRecord.statusReason}</p>
            )}
            <Link
              href={`/intake?siteId=${encodeURIComponent(site.id)}&assetId=${encodeURIComponent(submittedRecord.assetId)}`}
              className="mt-3 inline-flex text-[12px] font-semibold text-paper-ink underline underline-offset-2"
            >
              Open this evidence record
            </Link>
          </div>
        )}

        {currentGrade && (
          <div className="rounded-[4px] border border-paper-line bg-paper-surface px-4 py-2.5 mb-8">
            <span className="font-mono text-[12px] text-paper-ink-muted">Site status: </span>
            <span className="font-semibold text-paper-ink">{currentGrade}</span>
          </div>
        )}

        <Link
          href={`/s/${site.slug}`}
          className="inline-flex h-12 items-center justify-center rounded-[4px] bg-paper-ink px-6 text-[14px] font-semibold text-paper hover:opacity-90"
        >
          View public site timeline
        </Link>
      </div>
    );
  }

  // --- PHASE 5: OFFLINE SAVED ---
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper p-6 text-center text-paper-ink">
      <CheckCircle2 className="h-16 w-16 text-measure mb-4" />
      <h1 className="font-serif text-2xl font-bold tracking-tight mb-2">Saved on this phone</h1>
      <p className="max-w-xs text-[15px] text-paper-ink-muted mb-8">
        It will retry when you&apos;re back online. Until the upload finishes, it is pending and has no ledger record yet.
      </p>

      <Link
        href={`/s/${site.slug}`}
        className="inline-flex h-12 items-center justify-center rounded-[4px] border border-paper-line px-6 text-[14px] font-semibold text-paper-ink hover:bg-paper-surface"
      >
        View public site page
      </Link>
    </div>
  );
}
