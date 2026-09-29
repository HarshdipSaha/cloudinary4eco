export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { deps } from "@/adapters/container";
import * as repo from "@/ledger/repo";
import { applyReview } from "@/pipeline/review";


const Body = z.object({
  action: z.enum(["accept", "set_aside", "assign_site"]),
  siteId: z.string().optional(),
  reason: z.string().min(1),
  actor: z.string().default("reviewer"),
});

export async function GET(req: Request, props: { params: Promise<{ assetId: string[] }> }) {
  try {
    const assetId = (await props.params).assetId.join("/");
    const d = await deps();
    const e = await repo.evidenceItem(d.db, assetId);
    if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const decs = await repo.decisionsFor(d.db, assetId);
    const deriv = await repo.derivativeFor(d.db, assetId);
    const publicVideoImport = e.videoImportId ? await repo.publicVideoImport(d.db, e.videoImportId) : null;
    const s = e.siteId ? await repo.site(d.db, e.siteId) : null;
    const allSites = await repo.sitesForProject(d.db, e.projectId);
    return NextResponse.json({ evidence: e, decisions: decs, derivative: deriv, publicVideoImport, site: s, sites: allSites });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request, props: { params: Promise<{ assetId: string[] }> }) {
  try {
    const assetId = (await props.params).assetId.join("/");
    const body = Body.parse(await req.json());
    const d = await deps();

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

export async function DELETE(_req: Request, props: { params: Promise<{ assetId: string[] }> }) {
  try {
    const assetId = (await props.params).assetId.join("/");
    const d = await deps();
    const evidence = await repo.evidenceItem(d.db, assetId);
    if (evidence?.videoImportId) {
      return NextResponse.json({ error: "Delete the entire public video import so its shared source remains auditable." }, { status: 400 });
    }
    const { assetIds } = await repo.mediaAssetsForEvidenceDeletion(d.db, assetId);

    // Delete Cloudinary resources first. If that fails, the ledger entry remains available.
    await Promise.all(assetIds.map((id) => d.media.destroy(id)));
    await repo.deleteEvidence(d.db, assetId);

    return NextResponse.json({ ok: true, assetId });
  } catch (err) {
    const message = (err as Error).message;
    return NextResponse.json({ error: message }, { status: message === "Evidence not found" ? 404 : 400 });
  }
}
