import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlaquePrintPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const db = await getDb();
  const site = await repo.siteBySlug(db, slug);
  if (!site) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://saakshya.org";
  const witnessUrl = `${baseUrl}/w/${site.qrSlug ?? slug}`;

  // Generate QR code SVG
  const qrSvg = await QRCode.toString(witnessUrl, {
    type: "svg",
    margin: 1,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-8 print:p-0">
      {/* Printable A5 Sheet */}
      <div
        style={{ width: "148mm", minHeight: "210mm" }}
        className="relative flex flex-col justify-between rounded-[2px] border border-paper-line bg-paper p-10 text-paper-ink shadow-xl print:m-0 print:border-none print:shadow-none print:w-full print:min-h-screen"
      >
        {/* Top: Wordmark & Category */}
        <div className="flex items-center justify-between border-b border-paper-line pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-measure" />
            <span className="font-sans font-bold tracking-wider text-base text-paper-ink">
              SAAKSHYA
            </span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-paper-ink-muted">
            PUBLIC WITNESS PLAQUE
          </span>
        </div>

        {/* Center: Site Name, Callout, QR Code */}
        <div className="my-auto flex flex-col items-center text-center space-y-6">
          <h1 className="font-serif text-[32px] font-bold leading-tight text-paper-ink">
            {site.name}
          </h1>

          <p className="max-w-[100mm] text-[15px] leading-relaxed text-paper-ink-muted">
            Scan to add a photo of this site and anchor your observation to the public verification ledger.
          </p>

          {/* QR Code SVG container */}
          <div
            className="flex items-center justify-center p-3 rounded-[4px] border border-paper-line bg-white shadow-xs [&>svg]:w-[52mm] [&>svg]:h-[52mm]"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          {/* Short URL in mono */}
          <div className="font-mono text-[13px] font-medium text-paper-ink">
            {witnessUrl}
          </div>
        </div>

        {/* Bottom Note */}
        <div className="border-t border-paper-line pt-4 text-center font-mono text-[10px] text-paper-ink-muted space-y-1">
          <div>Faces and personal identities are blurred before publication.</div>
          <div>Photographic evidence is verified using deterministic computer vision and TypeSafe Jev.</div>
        </div>
      </div>
    </div>
  );
}
