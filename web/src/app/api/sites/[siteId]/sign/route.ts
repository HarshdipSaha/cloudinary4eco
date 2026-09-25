export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { deps } from "@/adapters/container";
import { signReading } from "@/pipeline/review";

const Body = z.object({
  timepoint: z.string().min(1),
  grade: z.number().int().min(0).max(5),
  reason: z.string().optional(),
  actor: z.string().default("manager"),
});

export async function POST(req: Request, props: { params: Promise<{ siteId: string }> }) {
  try {
    const { siteId } = await props.params;
    const body = Body.parse(await req.json());
    const d = await deps();

    await signReading(d, {
      siteId,
      timepoint: body.timepoint,
      grade: body.grade,
      reason: body.reason,
      actor: body.actor,
    });

    return NextResponse.json({ ok: true, siteId, timepoint: body.timepoint, grade: body.grade });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
