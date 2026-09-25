"use client";

import { useEffect, useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

interface ServiceStatus {
  state: "up" | "down";
  detail: string;
  checkedAt: string;
}

export function ServiceLamps() {
  const [status, setStatus] = useState<Record<string, ServiceStatus> | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchStatus() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          if (mounted) setStatus(data);
        }
      } catch {
        // network or server error
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const services = [
    { key: "jev", label: "Jev" },
    { key: "cloudinary", label: "Cloudinary" },
    { key: "cv", label: "CV" },
  ];

  const anyDown = status && Object.values(status).some((s) => s.state === "down");
  const downServiceName =
    status &&
    Object.entries(status)
      .filter(([_, s]) => s.state === "down")
      .map(([k]) => k.toUpperCase())
      .join(", ");

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="flex flex-col">
        <div className="flex items-center gap-4 text-[12px] text-text-2">
          {services.map(({ key, label }) => {
            const s = status?.[key];
            const isUp = s?.state === "up";
            return (
              <Tooltip.Root key={key}>
                <Tooltip.Trigger asChild>
                  <div className="flex cursor-default items-center gap-1.5 focus:outline-none">
                    <span
                      aria-hidden="true"
                      className={`size-1.5 shrink-0 ${
                        isUp ? "bg-measure" : "border border-text-3 bg-transparent"
                      }`}
                    />
                    <span className={isUp ? "text-text" : "text-text-3"}>{label}</span>
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="z-50 border border-line bg-surface-1 px-2.5 py-1.5 text-[11px] text-text shadow-none"
                    sideOffset={5}
                  >
                    <div className="font-medium text-text">{label}</div>
                    <div className="text-text-2">{s?.detail ?? "Checking..."}</div>
                    {s?.checkedAt && (
                      <div className="mono mt-1 text-[10px] text-text-3">
                        Checked {new Date(s.checkedAt).toLocaleTimeString()}
                      </div>
                    )}
                    <Tooltip.Arrow className="fill-line" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>
        {anyDown && (
          <div className="absolute top-[44px] left-0 right-0 z-40 border-b border-line bg-surface-1 px-4 py-1 text-[12px] text-attention">
            {downServiceName} is unreachable. New decisions will be marked pending, not guessed.
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
}
