import { NextResponse } from "next/server";
import { deps } from "@/adapters/container";
import { composeVideoCampaign } from "@/pipeline/video-campaign";

export const runtime = "nodejs";

export async function POST(_req: Request, props: { params: Promise<{ importId: string }> }) {
  const importId = (await props.params).importId;
  try {
    const campaignId = await composeVideoCampaign(await deps(), importId);
    return NextResponse.json({ campaignId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
