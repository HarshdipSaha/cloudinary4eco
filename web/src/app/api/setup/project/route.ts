export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { deps } from "@/adapters/container";
import * as repo from "@/ledger/repo";
import type { ProjectType } from "@/domain/types";

const Body = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["plantation", "cleanup", "water_point", "sanitation", "construction"]),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const { db } = await deps();
    await repo.createProject(db, {
      id: body.id,
      name: body.name,
      type: body.type as ProjectType,
    });
    return NextResponse.json({ ok: true, project: body });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
