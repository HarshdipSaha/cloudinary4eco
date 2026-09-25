import { notFound } from "next/navigation";
import { getDb } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { ReadingPanel } from "@/ui/site/ReadingPanel";

export const dynamic = "force-dynamic";

export default async function SiteChartPage(props: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await props.params;
  const db = await getDb();
  const data = await repo.siteChart(db, siteId);

  if (!data.site) {
    notFound();
  }

  return (
    <ReadingPanel
      site={data.site}
      project={data.project}
      baseline={data.baseline as any}
      timepoints={data.timepoints as any}
      candidates={data.candidates as any}
      counts={data.counts}
      agreement={data.agreement}
    />
  );
}
