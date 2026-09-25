export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { deps } from "@/adapters/container";
import * as repo from "@/ledger/repo";
import { ingestBatch } from "@/pipeline/ingest";
import { gradeLabel } from "@/domain/src-rubrics";
import type { ProjectType } from "@/domain/types";

const Body = z.object({
  assetId: z.string().min(1),
  comment: z.string().optional(),
});

export async function POST(req: Request, props: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await props.params;
    const body = Body.parse(await req.json());
    const d = await deps();
    const site = await repo.siteBySlug(d.db, slug);
    if (!site) return NextResponse.json({ error: "Unknown site slug" }, { status: 404 });

    const batchId = nanoid(10);
    await ingestBatch(d, {
      projectId: site.projectId,
      source: "witness",
      siteId: site.id,
      assetIds: [body.assetId],
      batchId,
      meta: body.comment ? { [body.assetId]: { comment: body.comment } } : undefined,
    });

    const item = await repo.evidenceItem(d.db, body.assetId);
    const project = await repo.project(d.db, site.projectId);
    const lastAssessment = (await repo.assessmentsForSite(d.db, site.id)).filter((a) => a.grade !== null).at(-1);

    const latestGradeLabel =
      lastAssessment && project ? gradeLabel(project.type as ProjectType, lastAssessment.grade!) : null;

    return NextResponse.json({
      assetId: body.assetId,
      status: item?.status ?? "pending",
      statusReason: item?.statusReason ?? null,
      siteId: site.id,
      siteName: site.name,
      latestGrade: latestGradeLabel,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
