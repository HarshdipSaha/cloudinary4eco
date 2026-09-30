import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";

export const dynamic = "force-dynamic";

function json(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

export default async function DecisionReceiptPage(props: {
  params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = await props.params;
  if (!/^\d+$/.test(decisionId)) notFound();

  const db = await getDb();
  const decision = await repo.decision(db, Number(decisionId));
  if (!decision) notFound();

  const siteId = decision.kind === "src_grade"
    ? decision.subjectId.split("@")[0]
    : decision.kind === "witness_agreement"
      ? decision.subjectId
      : null;
  const reportId = decision.kind === "sentence_support"
    ? decision.subjectId.split("#")[0]
    : null;
  const assetId = decision.kind.startsWith("triage_") ? decision.subjectId : null;

  const relatedHref = siteId
    ? `/sites/${encodeURIComponent(siteId)}`
    : reportId
      ? `/reports/${encodeURIComponent(reportId)}`
      : assetId
        ? `/intake?assetId=${encodeURIComponent(assetId)}`
        : "/judge";
  const relatedLabel = siteId ? "Open site comparison" : reportId ? "Open report" : assetId ? "Open evidence item" : "Return to walkthrough";

  const probabilityRows = decision.probabilities
    ? Object.entries(decision.probabilities as Record<string, number>).sort((a, b) => b[1] - a[1])
    : [];
  const isPending = decision.status === "pending";

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10 text-paper-ink">
      <Link href="/judge" className="font-mono text-[12px] text-paper-ink-muted underline underline-offset-2">
        Back to judge walkthrough
      </Link>

      <header className="mt-8 border-b border-paper-line pb-6">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-paper-ink-muted">
          <ShieldCheck className="h-4 w-4 text-measure" />
          <span>Decision receipt · #{decision.id}</span>
          <span className={`ml-auto rounded-[2px] border px-2 py-1 ${isPending ? "border-attention/40 text-attention" : "border-measure/40 text-measure"}`}>
            {isPending ? "Pending" : "Recorded"}
          </span>
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold capitalize">
          {decision.kind.replaceAll("_", " ")}
        </h1>
        <p className="mt-2 text-[14px] text-paper-ink-muted">
          {isPending ? decision.reason ?? "The decision service did not return a result." : `Stored answer: ${String(decision.answer)}`}
        </p>
        <Link href={relatedHref} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold underline underline-offset-2">
          {relatedLabel}<ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="border border-paper-line bg-paper-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-paper-ink-muted">Model</div>
          <div className="mt-1 font-mono text-[13px]">{decision.model ?? "Not returned"}</div>
        </div>
        <div className="border border-paper-line bg-paper-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-paper-ink-muted">Latency / input tokens</div>
          <div className="mt-1 font-mono text-[13px]">
            {decision.latencyMs ?? "—"} ms / {decision.inputTokens ?? "—"}
          </div>
        </div>
        <div className="border border-paper-line bg-paper-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-paper-ink-muted">Recorded</div>
          <div className="mt-1 font-mono text-[13px]">{new Date(decision.createdAt).toLocaleString()}</div>
        </div>
      </section>

      {probabilityRows.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-xl font-bold">Returned probabilities</h2>
          <div className="mt-3 divide-y divide-paper-line border-y border-paper-line">
            {probabilityRows.map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 font-mono text-[13px]">
                <span>{label}</span><span>{Math.round(value * 1000) / 10}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {decision.stateHash && (
        <section className="mt-8">
          <h2 className="font-serif text-xl font-bold">State hash</h2>
          <code className="mt-3 block break-all border border-paper-line bg-paper-surface p-3 font-mono text-[11px]">{decision.stateHash}</code>
        </section>
      )}

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-xl font-bold">Question</h2>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words border border-paper-line bg-paper-surface p-3 font-mono text-[11px]">{json(decision.question)}</pre>
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold">Decision state</h2>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words border border-paper-line bg-paper-surface p-3 font-mono text-[11px]">{json(decision.state)}</pre>
        </div>
      </section>
    </main>
  );
}
