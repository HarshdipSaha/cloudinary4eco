export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { deps } from "@/adapters/container";
import { search } from "@/search/search";
import { urls } from "@/adapters/cloudinary/urls";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? "yamuna-green";
    const siteId = searchParams.get("siteId") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const query = searchParams.get("query") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const source = searchParams.get("source") ?? undefined;
    const gradeStr = searchParams.get("grade");
    const grade = gradeStr !== null && gradeStr !== "" ? parseInt(gradeStr, 10) : undefined;
    const flaggedStr = searchParams.get("flagged");
    const flagged = flaggedStr !== null && flaggedStr !== "" ? flaggedStr === "true" : undefined;

    const d = await deps();
    const result = await search(d, {
      projectId,
      siteId,
      from,
      to,
      query,
      status,
      source,
      grade,
      flagged,
    });


    const urlBuilder = urls();
    const items = result.items.map((item) => ({
      ...item,
      thumbUrl: urlBuilder.thumb(item.assetId),
    }));

    return NextResponse.json({
      reranked: result.reranked,
      items,
    });
  } catch (err) {

    const msg = (err as any)?.message || (err as any)?.error?.message || String(err);
    console.error("Search API failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

