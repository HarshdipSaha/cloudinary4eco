export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { deps } from "@/adapters/container";
import * as repo from "@/ledger/repo";

const rand4 = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 4);

const Body = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  lat: z.number(),
  lon: z.number(),
  radiusM: z.number().int().positive().default(100),
  qrSlug: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const { db } = deps();
    const slugBase = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const qrSlug = body.qrSlug || `${slugBase}-${rand4()}`;

    await repo.createSite(db, {
      id: body.id,
      projectId: body.projectId,
      name: body.name,
      description: body.description,
      location: { lat: body.lat, lon: body.lon },
      radiusM: body.radiusM,
      baselineAssetId: null,
      qrSlug,
    });

    return NextResponse.json({ ok: true, site: { ...body, qrSlug } });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
