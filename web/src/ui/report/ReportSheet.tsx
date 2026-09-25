"use client";

import { useState } from "react";
import Link from "next/link";
import { cld } from "@/ui/cld";
import { Button } from "@/ui/Button";
import { Printer, Share2, RefreshCw, Check, ShieldAlert, CheckCircle2, ArrowUpRight } from "lucide-react";

export interface ReportFact {
  id: string;
  text: string;
  evidenceIds: string[];
  derivative?: {
    baselineAssetId: string;
    alignedAssetId?: string;
  } | null;
  siteId?: string;
  timepoint?: string;
}

export interface ReportSentenceItem {
  id: number;
  section: string;
  ordinal: number;
  text: string;
  factIds: string[];
  support: number | null;
  status: "kept" | "struck" | "pending";
  reason: string | null;
}

const SUPERSCRIPTS = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
function toSuperscript(num: number): string {
  return String(num)
    .split("")
    .map((c) => SUPERSCRIPTS[parseInt(c, 10)] ?? c)
    .join("");
}

export function ReportSheet({
  report,
  sentences,
  facts,
  projectName,
  siteCount,
  photoCount,
  isPublic = false,
}: {
  report: {
    id: string;
    publicSlug: string;
    periodStart: string;
    periodEnd: string;
    createdAt: string | Date;
  };
  sentences: ReportSentenceItem[];
  facts: ReportFact[];
  projectName: string;
  siteCount: number;
  photoCount: number;
  isPublic?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const factMap = new Map(facts.map((f) => [f.id, f]));

  // In public mode, hide struck and pending sentences
  const visibleSentences = isPublic
    ? sentences.filter((s) => s.status === "kept")
    : sentences;

  const struckCount = sentences.filter((s) => s.status === "struck").length;

  function copyPublicLink() {
    const url = `${window.location.origin}/r/${report.publicSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center py-6">
      {/* Action Bar (Screen only) */}
      <div className="print:hidden mb-6 flex w-full max-w-[1020px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {!isPublic && (
            <Link
              href="/reports"
              className="text-[13px] text-text-3 hover:text-text font-mono"
            >
              ← Back to reports
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="quiet"
            onClick={() => window.print()}
            className="gap-1.5 text-[12px]"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / PDF</span>
          </Button>

          {!isPublic && (
            <Button
              variant="primary"
              onClick={copyPublicLink}
              className="gap-1.5 text-[12px]"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-surface-0" /> : <Share2 className="h-3.5 w-3.5 text-surface-0" />}
              <span>{copied ? "Link Copied" : "Publish Link"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* The Sheet: Paper theme laid on reading-room ground */}
      <div
        data-theme="paper"
        className="w-full max-w-[1020px] rounded-[2px] border border-paper-line bg-paper p-10 text-paper-ink shadow-2xl print:m-0 print:max-w-none print:border-none print:p-0 print:shadow-none font-sans"
      >
        {/* Title Block */}
        <header className="border-b border-paper-line pb-6 mb-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-paper-ink-muted">
              SAAKSHYA ATTRIBUTABLE INTEGRITY REPORT
            </span>
            <span className="font-mono text-[11px] text-paper-ink-muted">
              SLUG: {report.publicSlug}
            </span>
          </div>

          <h1 className="mt-2 font-serif text-[34px] font-bold leading-tight text-paper-ink">
            {projectName}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-paper-ink-muted font-mono">
            <span>
              Period: {report.periodStart} → {report.periodEnd}
            </span>
            <span>·</span>
            <span>
              Prepared from {photoCount} photos across {siteCount} site{siteCount > 1 ? "s" : ""}
            </span>
            <span>·</span>
            <span>
              {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="mt-2 text-[11px] text-paper-ink-muted font-mono">
            Models: Drafter (Llama 3.3 70B) · Fact Verifier (TypeSafe Jev calibrated)
          </div>
        </header>

        {/* Report Content Grid: [62ch body][32px gutter][280px margin] */}
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold border-b border-paper-line pb-2">
            Findings & Observations
          </h2>

          <div className="space-y-6">
            {visibleSentences.map((sentence, idx) => {
              const factList = sentence.factIds
                .map((fid) => factMap.get(fid))
                .filter(Boolean) as ReportFact[];

              const firstFact = factList[0];
              const firstEvidenceId = firstFact?.evidenceIds[0];
              const derivative = firstFact?.derivative;

              return (
                <div
                  key={sentence.id}
                  className="grid grid-cols-1 lg:grid-cols-[62ch_32px_280px] items-start gap-y-3 print:grid-cols-1 print:gap-y-2"
                >
                  {/* Body Text */}
                  <div className="font-serif text-[17px] leading-[1.65] text-paper-ink">
                    {sentence.status === "struck" ? (
                      <span className="line-through decoration-flag/60 text-paper-ink-muted bg-flag/5 px-1 rounded">
                        {sentence.text}
                      </span>
                    ) : (
                      <span>
                        {sentence.text}
                        <sup className="ml-0.5 font-mono text-[12px] font-semibold text-measure">
                          {toSuperscript(idx + 1)}
                        </sup>
                      </span>
                    )}
                  </div>

                  {/* Gutter */}
                  <div className="hidden lg:block" aria-hidden="true" />

                  {/* Margin: Receipts, Fact Text, Support Score */}
                  <div className="rounded-[3px] border border-paper-line bg-paper-surface p-3 text-[12px] space-y-2 print:border-none print:p-0 print:mt-1">
                    {sentence.status === "struck" ? (
                      <div className="space-y-1 text-flag">
                        <div className="flex items-center gap-1.5 font-mono font-semibold text-[11px]">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Overclaim Withheld</span>
                        </div>
                        <p className="text-[11px] leading-snug">
                          {sentence.reason ?? "Model draft lacked empirical receipt backing in the ledger."}
                        </p>
                      </div>
                    ) : sentence.status === "pending" ? (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-attention">
                        <span>◌ Check pending</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Receipt Thumbnail */}
                        {derivative?.baselineAssetId && derivative.alignedAssetId ? (
                          <div className="relative aspect-2/1 w-full max-w-[240px] overflow-hidden rounded-[2px] border border-paper-line bg-black">
                            <img
                              src={
                                isPublic
                                  ? cld.publicPlate(derivative.alignedAssetId, 480)
                                  : cld.plate(derivative.alignedAssetId, 480)
                              }
                              alt="Side by side receipt"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : firstEvidenceId ? (
                          <div className="relative aspect-4/3 w-28 overflow-hidden rounded-[2px] border border-paper-line bg-black">
                            <img
                              src={
                                isPublic
                                  ? cld.publicPlate(firstEvidenceId, 240)
                                  : cld.plate(firstEvidenceId, 240)
                              }
                              alt="Receipt thumb"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : null}

                        {/* Fact detail */}
                        {firstFact && (
                          <div className="font-mono text-[11px] text-paper-ink-muted leading-tight">
                            {firstFact.text}
                          </div>
                        )}

                        {/* Jev support score */}
                        {sentence.support !== null && (
                          <div className="flex items-center justify-between font-mono text-[10px] text-paper-ink-muted pt-1 border-t border-paper-line">
                            <span className="flex items-center gap-1 text-measure font-semibold">
                              <CheckCircle2 className="h-3 w-3" />
                              Jev support {Math.round(sentence.support * 100)}%
                            </span>
                            {firstFact?.siteId && !isPublic && (
                              <Link
                                href={`/sites/${firstFact.siteId}`}
                                className="inline-flex items-center gap-0.5 hover:underline"
                              >
                                <span>Inspect</span>
                                <ArrowUpRight className="h-2.5 w-2.5" />
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Audit Statement */}
        <footer className="mt-12 border-t border-paper-line pt-6 text-[13px] text-paper-ink-muted space-y-1">
          <p>
            Every sentence above links to its evidence.{" "}
            {struckCount > 0
              ? `${struckCount} drafted sentence${struckCount > 1 ? "s were" : " was"} withheld because the evidence did not support them.`
              : "All drafted claims were verified and supported by photographic ledger evidence."}
          </p>
          <p className="font-mono text-[11px]">
            Methodology: Sentence support verified using atomic fact attribution (Rashkin AIS / FActScore principles) via TypeSafe Jev discrete calibrated decisions.
          </p>
        </footer>
      </div>
    </div>
  );
}
