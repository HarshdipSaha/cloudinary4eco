export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { deps } from "@/adapters/container";
import { assessSite } from "@/pipeline/assess";

const Body = z.object({
  timepoint: z.string().min(1),
});

export async function POST(req: Request, props: { params: Promise<{ siteId: string }> }) {
  try {
    const { siteId } = await props.params;
    const body = Body.parse(await req.json());
    const d = await deps();

    const result = await assessSite(d, siteId, body.timepoint);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
