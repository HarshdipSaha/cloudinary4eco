import { notFound } from "next/navigation";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { WitnessCapture } from "@/ui/witness/WitnessCapture";

export const dynamic = "force-dynamic";

export default async function WitnessCapturePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const db = getDb();
  const site = await repo.siteBySlug(db, slug);
  if (!site) notFound();

  const assessments = await repo.assessmentsForSite(db, site.id);
  const latest = assessments.at(-1);

  return (
    <WitnessCapture
      site={{
        id: site.id,
        slug: site.qrSlug ?? slug,
        name: site.name,
        baselineAssetId: site.baselineAssetId,
      }}
      gradeLabel={latest?.grade ? `Grade ${latest.grade}` : undefined}
    />
  );
}
