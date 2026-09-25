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

    const d = deps();
    const result = await search(d, {
      projectId,
      siteId,
      from,
      to,
      query,
      status,
      source,
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
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
