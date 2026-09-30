"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";
import { X, Video } from "lucide-react";

type Site = { id: string; name: string };

export function PublicVideoDialog({
  projectId,
  sites,
  onClose,
  onComplete,
}: {
  projectId: string;
  sites: Site[];
  onClose: () => void;
  onComplete: () => void;
}) {
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [sourceUrl, setSourceUrl] = useState("");
  const [permissionNote, setPermissionNote] = useState("");
  const [state, setState] = useState("ready");
  const [error, setError] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setState("validating");
    try {
      const response = await fetch("/api/public-video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, siteId, sourceUrl, permissionNote }),
      });
      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error("The video analysis stream was unavailable.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const next = await reader.read();
        buffer += decoder.decode(next.value ?? new Uint8Array(), { stream: !next.done });
        for (const line of buffer.split("\n").slice(0, -1)) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as { type: string; message?: string; importId?: string };
          if (event.importId) setImportId(event.importId);
          if (event.type === "error" || event.type === "video_failed") throw new Error(event.message ?? "Video analysis failed.");
          if (event.type === "video_imported") setState("extracting frames");
          else if (event.type === "video_frame") setState("analysing");
          else if (event.type === "video_complete") setState("complete");
        }
        buffer = buffer.split("\n").at(-1) ?? "";
        if (next.done) break;
      }
      if (state !== "complete") setState("complete");
      onComplete();
    } catch (err) {
      setState("failed");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-[2px] border border-line bg-surface-1 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <Video className="h-4 w-4 text-measure" />
            Analyse public video
          </div>
          <button onClick={onClose} aria-label="Close" className="text-text-3 hover:text-text"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block text-[11px] text-text-3">Public HTTPS video URL
            <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://.../video.mp4" className="mt-1 w-full rounded-[2px] border border-line bg-surface-0 p-2 text-[12px] text-text" />
          </label>
          <label className="block text-[11px] text-text-3">Site
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="mt-1 w-full rounded-[2px] border border-line bg-surface-0 p-2 text-[12px] text-text">
              {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
          </label>
          <label className="block text-[11px] text-text-3">Permission note
            <textarea value={permissionNote} onChange={(e) => setPermissionNote(e.target.value)} placeholder="I own this video / have permission to submit it." rows={2} className="mt-1 w-full rounded-[2px] border border-line bg-surface-0 p-2 text-[12px] text-text" />
          </label>
          <p className="text-[11px] leading-relaxed text-text-3">SAAKSHYA analyses three representative frames. A web URL does not prove the video’s capture time or GPS, so those signals remain marked missing.</p>
          {error && <p className="text-[11px] text-flag">{error}</p>}
          {state !== "ready" && <p className="font-mono text-[11px] text-measure">Status: {state}</p>}
          {state === "complete" && importId && (
            <a href={`/videos/${encodeURIComponent(importId)}`} className="block text-[12px] text-measure underline underline-offset-2">
              Open video rubric
            </a>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="quiet" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={state === "complete" ? onClose : submit} disabled={!siteId || !sourceUrl.trim() || permissionNote.trim().length < 3 || ["validating", "importing", "extracting frames", "analysing"].includes(state)}>
              {state === "complete" ? "Done" : "Analyse frames"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
