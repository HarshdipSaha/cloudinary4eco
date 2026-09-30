"use client";

import { useEffect, useState } from "react";

type Service = { state: "up" | "down"; detail: string; checkedAt: string };
type Status = Record<"jev" | "cloudinary" | "cv", Service>;

const LABELS: Record<keyof Status, string> = {
  cloudinary: "Cloudinary",
  cv: "Python CV worker",
  jev: "Jev",
};

export function ServiceStatus() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Service status check failed");
        return response.json() as Promise<Status>;
      })
      .then((value) => active && setStatus(value))
      .catch(() => active && setStatus(null));
    return () => { active = false; };
  }, []);

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {(Object.keys(LABELS) as (keyof Status)[]).map((key) => {
        const service = status?.[key];
        const isUp = service?.state === "up";
        return (
          <div key={key} className="border border-paper-line bg-paper-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-paper-ink-muted">{LABELS[key]}</span>
              <span className={`rounded-[2px] border px-2 py-0.5 font-mono text-[10px] uppercase ${isUp ? "border-measure/40 text-measure" : "border-attention/40 text-attention"}`}>
                {isUp ? "Live" : "Pending"}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-paper-ink-muted">
              {service?.detail ?? "Reachability not confirmed yet."}
            </p>
            {service?.checkedAt && (
              <time className="mt-1 block font-mono text-[10px] text-paper-ink-muted" dateTime={service.checkedAt}>
                Checked {new Date(service.checkedAt).toLocaleTimeString()}
              </time>
            )}
          </div>
        );
      })}
    </div>
  );
}
