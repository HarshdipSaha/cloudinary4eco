export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { deps } from "@/adapters/container";
import * as repo from "@/ledger/repo";

const Body = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  siteId: z.string().nullable().optional(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  text: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const { db } = await deps();
    await repo.createClaim(db, {
      id: body.id,
      projectId: body.projectId,
      siteId: body.siteId ?? null,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      text: body.text,
    });
    return NextResponse.json({ ok: true, claim: body });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
