export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { deps } from "@/adapters/container";
import { composeReport } from "@/reports/compose";

const Body = z.object({
  projectId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  includeSeededControl: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const d = await deps();

    const reportId = await composeReport(d, {
      projectId: body.projectId,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      includeSeededControl: body.includeSeededControl,
    });

    return NextResponse.json({ reportId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
