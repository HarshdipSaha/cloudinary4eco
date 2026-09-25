export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { deps } from "@/adapters/container";
import { applyReview } from "@/pipeline/review";

const Body = z.object({
  action: z.enum(["accept", "set_aside", "assign_site"]),
  siteId: z.string().optional(),
  reason: z.string().min(1),
  actor: z.string().default("reviewer"),
});

export async function POST(req: Request, props: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await props.params;
    const body = Body.parse(await req.json());
    const d = deps();

    await applyReview(d, {
      assetId,
      action: body.action,
      siteId: body.siteId,
      reason: body.reason,
      actor: body.actor,
    });

    return NextResponse.json({ ok: true, assetId, action: body.action });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
