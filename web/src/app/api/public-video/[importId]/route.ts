import { NextResponse } from "next/server";
import { deps } from "@/adapters/container";
import * as repo from "@/ledger/repo";

export const runtime = "nodejs";

export async function DELETE(_req: Request, props: { params: Promise<{ importId: string }> }) {
  const importId = (await props.params).importId;
  try {
    const d = await deps();
    const imported = await repo.publicVideoImport(d.db, importId);
    if (!imported) return NextResponse.json({ error: "Public video import not found" }, { status: 404 });

    const frames = await repo.publicVideoFrames(d.db, importId);
    const imageAssets = new Set<string>();
    for (const frame of frames) {
      const deletion = await repo.mediaAssetsForEvidenceDeletion(d.db, frame.assetId);
      for (const assetId of deletion.assetIds) imageAssets.add(assetId);
    }
    for (const assetId of imageAssets) await d.media.destroy(assetId);
    try {
      await d.media.destroyVideo(imported.remoteVideoAssetId);
    } catch (error) {
      await repo.updatePublicVideoImport(d.db, importId, {
        status: "deletion_failed",
        statusReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    try {
      await repo.deletePublicVideoImportRows(d.db, importId);
    } catch (error) {
      await repo.updatePublicVideoImport(d.db, importId, {
        status: "deletion_failed",
        statusReason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    return NextResponse.json({ ok: true, importId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
