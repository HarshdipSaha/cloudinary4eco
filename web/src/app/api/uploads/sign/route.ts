export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { deps } from "@/adapters/container";
import * as repo from "@/ledger/repo";

const Body = z.union([
  z.object({ projectId: z.string().min(1), source: z.enum(["implementer", "bulk_import"]) }),
  z.object({ siteSlug: z.string().min(1) }),
]);
const folderRoot = process.env.CLOUDINARY_FOLDER ?? "saakshya";
const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const { db, media } = deps();
    if ("siteSlug" in body) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
      const now = Date.now();
      const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
      if (recent.length >= 20) {
        return NextResponse.json({ error: "Too many uploads from this network. Try again later." }, { status: 429 });
      }
      hits.set(ip, [...recent, now]);
      const site = await repo.siteBySlug(db, body.siteSlug);
      if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 404 });
      return NextResponse.json(
        media.signUpload({
          folder: `${folderRoot}/${site.projectId}/witness`,
          context: { project_id: site.projectId, site_id: site.id, source: "witness" },
        })
      );
    }
    return NextResponse.json(
      media.signUpload({
        folder: `${folderRoot}/${body.projectId}/${body.source}`,
        context: { project_id: body.projectId, source: body.source },
      })
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
