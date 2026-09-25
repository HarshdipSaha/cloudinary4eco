"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/Button";
import { FileText, Loader2 } from "lucide-react";

export function NewReportForm({
  projectId,
  defaultStart,
  defaultEnd,
}: {
  projectId: string;
  defaultStart: string;
  defaultEnd: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep("Collecting facts from ledger...");

    try {
      setTimeout(() => setStep("Drafting narrative..."), 1500);
      setTimeout(() => setStep("Checking each sentence against its receipts with Jev..."), 3000);

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          periodStart,
          periodEnd,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to generate report");
      }

      const data = await res.json();
      router.push(`/reports/${data.reportId}`);
    } catch (err) {
      setError((err as Error).message);
      setStep(null);
    }
  }

  return (
    <div>
      {!isOpen ? (
        <Button
          variant="primary"
          onClick={() => setIsOpen(true)}
          className="gap-1.5"
        >
          <FileText className="h-4 w-4 text-surface-0" />
          <span>New Attributable Report</span>
        </Button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="rounded-[2px] border border-line bg-surface-1 p-4 space-y-4 max-w-lg"
        >
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="text-sm font-semibold text-text">Generate New Report</h3>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setStep(null);
              }}
              className="text-[12px] text-text-3 hover:text-text"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-text-3 mb-1">
                Period Start (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
                className="w-full rounded-[2px] border border-line bg-surface-0 px-2 py-1.5 text-[12px] text-text"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-text-3 mb-1">
                Period End (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
                className="w-full rounded-[2px] border border-line bg-surface-0 px-2 py-1.5 text-[12px] text-text"
              />
            </div>
          </div>

          {step && (
            <div className="flex items-center gap-2 rounded bg-surface-2 p-2.5 font-mono text-[11px] text-measure">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{step}</span>
            </div>
          )}

          {error && <div className="text-[11px] text-flag">{error}</div>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="quiet"
              onClick={() => {
                setIsOpen(false);
                setStep(null);
              }}
              disabled={Boolean(step)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={Boolean(step)}
            >
              {step ? "Processing..." : "Generate Report"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
