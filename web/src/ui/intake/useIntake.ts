"use client";

import { useState, useRef } from "react";
import { unpackFiles } from "./unpack";
import type { Flag } from "@/domain/types";

export type RowState = "queued" | "uploading" | "analyzing" | "decided" | "pending" | "error";

export interface IntakeRow {
  localId: string;
  name: string;
  file?: File;
  objectUrl: string;
  state: RowState;
  progress: number;
  assetId?: string;
  siteId?: string | null;
  siteName?: string | null;
  siteConfidence?: number | null;
  relevance?: string;
  activity?: string;
  status?: string;
  statusReason?: string | null;
  flags: Flag[];
  thumbUrl?: string;
  sender?: string;
  sentAt?: string;
  comment?: string | null;
  error?: string;
}


export interface IntakeTotals {
  processed: number;
  decisions: number;
  inputTokens: number;
  usd: number;
  elapsedSec: number;
}

export function useIntake(projectId: string) {
  const [rows, setRows] = useState<IntakeRow[]>([]);
  const [totals, setTotals] = useState<IntakeTotals>({
    processed: 0,
    decisions: 0,
    inputTokens: 0,
    usd: 0,
    elapsedSec: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  async function handleFiles(fileList: File[]) {
    if (!fileList.length) return;
    setIsProcessing(true);
    if (!startTimeRef.current) startTimeRef.current = Date.now();

    const { images, meta } = await unpackFiles(fileList);
    const newRows: IntakeRow[] = images.map((f) => {
      const chatMeta = meta.get(f.name);
      return {
        localId: Math.random().toString(36).slice(2),
        name: f.name,
        file: f,
        objectUrl: URL.createObjectURL(f),
        state: "queued",
        progress: 0,
        flags: [],
        sender: chatMeta?.sender,
        sentAt: chatMeta?.sentAt,
        comment: chatMeta?.comment,
      };
    });

    setRows((prev) => [...prev, ...newRows]);

    // 1. Get signed direct upload signature for bulk_import
    let sigData: any;
    try {
      const sigRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, source: "bulk_import" }),
      });
      if (!sigRes.ok) throw new Error(await sigRes.text());
      sigData = await sigRes.json();
    } catch (err) {
      setRows((prev) =>
        prev.map((r) =>
          newRows.some((nr) => nr.localId === r.localId)
            ? { ...r, state: "error", error: "Failed to sign upload" }
            : r
        )
      );
      setIsProcessing(false);
      return;
    }

    // 2. Concurrency 4 direct upload to Cloudinary
    const finishedAssetIds: { localId: string; assetId: string }[] = [];
    const queue = [...newRows];
    const concurrency = 4;

    async function worker() {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;

        setRows((prev) =>
          prev.map((r) => (r.localId === item.localId ? { ...r, state: "uploading" } : r))
        );

        try {
          if (!item.file) continue;
          const form = new FormData();
          form.append("file", item.file);

          for (const [k, v] of Object.entries(sigData.params as Record<string, string>)) {
            form.append(k, v);
          }
          form.append("api_key", sigData.apiKey);
          form.append("signature", sigData.signature);

          const assetId = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(
              "POST",
              `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`
            );
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setRows((prev) =>
                  prev.map((r) => (r.localId === item.localId ? { ...r, progress: pct } : r))
                );
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const resp = JSON.parse(xhr.responseText);
                resolve(resp.public_id);
              } else {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
              }
            };
            xhr.onerror = () => reject(new Error("Network error during upload"));
            xhr.send(form);
          });

          setRows((prev) =>
            prev.map((r) =>
              r.localId === item.localId
                ? { ...r, assetId, state: "analyzing", progress: 100 }
                : r
            )
          );
          finishedAssetIds.push({ localId: item.localId, assetId });
        } catch (err) {
          setRows((prev) =>
            prev.map((r) =>
              r.localId === item.localId
                ? { ...r, state: "error", error: (err as Error).message }
                : r
            )
          );
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    // 3. Post to /api/intake for triage & grading
    if (finishedAssetIds.length > 0) {
      const metaObj: Record<string, any> = {};
      for (const { localId, assetId } of finishedAssetIds) {
        const item = newRows.find((r) => r.localId === localId);
        if (item) {
          metaObj[assetId] = {
            filename: item.name,
            sentAt: item.sentAt,
            sender: item.sender,
            comment: item.comment,
          };
        }
      }

      try {
        const intakeRes = await fetch("/api/intake", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            projectId,
            assetIds: finishedAssetIds.map((x) => x.assetId),
            meta: metaObj,
          }),
        });

        if (!intakeRes.ok || !intakeRes.body) throw new Error(await intakeRes.text());

        const reader = intakeRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line);
              if (event.type === "analyzed") {
                setRows((prev) =>
                  prev.map((r) =>
                    r.assetId === event.assetId
                      ? { ...r, thumbUrl: event.thumbUrl, state: "analyzing" }
                      : r
                  )
                );
              } else if (event.type === "decided") {
                setRows((prev) =>
                  prev.map((r) =>
                    r.assetId === event.assetId
                      ? {
                          ...r,
                          state: "decided",
                          status: event.status,
                          siteId: event.siteId,
                          statusReason: event.reason,
                          flags: event.flags,
                          relevance: event.relevance,
                          siteConfidence: event.siteConfidence,
                        }
                      : r
                  )
                );
              } else if (event.type === "pending") {
                setRows((prev) =>
                  prev.map((r) =>
                    r.assetId === event.assetId
                      ? { ...r, state: "pending", status: "pending", statusReason: event.reason }
                      : r
                  )
                );
              } else if (event.type === "done") {
                setTotals((prev) => ({
                  processed: prev.processed + event.total,
                  decisions: prev.decisions + (event.usage?.decisions ?? 0),
                  inputTokens: prev.inputTokens + (event.usage?.inputTokens ?? 0),
                  usd: prev.usd + (event.usage?.usd ?? 0),
                  elapsedSec: Math.round(
                    (Date.now() - (startTimeRef.current ?? Date.now())) / 1000
                  ),
                }));
              }
            } catch {
              // Ignore line parse error
            }
          }
        }
      } catch (err) {
        console.error("Intake stream failed:", err);
      }
    }

    setIsProcessing(false);
  }

  return { rows, totals, isProcessing, handleFiles, setRows };
}
