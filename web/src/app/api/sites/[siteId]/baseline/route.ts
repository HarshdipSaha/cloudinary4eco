export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { deps } from "@/adapters/container";
import * as repo from "@/ledger/repo";

const Body = z.object({
  assetId: z.string().min(1),
});

export async function POST(req: Request, props: { params: Promise<{ siteId: string }> }) {
  try {
    const { siteId } = await props.params;
    const body = Body.parse(await req.json());
    const { db } = deps();

    const site = await repo.site(db, siteId);
    if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 404 });

    await repo.setBaseline(db, siteId, body.assetId);
    return NextResponse.json({ ok: true, siteId, baselineAssetId: body.assetId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
