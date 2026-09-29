export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { deps } from "@/adapters/container";
import { AlignmentRetryConflict, retryPendingAlignment } from "@/pipeline/retry-registration";
import { RegistrationUnavailable } from "@/ports/registration";

const Body = z.object({ assetId: z.string().min(1) });

export async function POST(req: Request, props: { params: Promise<{ siteId: string }> }) {
  try {
    const { siteId } = await props.params;
    const { assetId } = Body.parse(await req.json());
    const result = await retryPendingAlignment(await deps(), siteId, assetId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof RegistrationUnavailable) {
      return NextResponse.json({
        error: "CV is still unavailable. The photo remains pending; try again when the worker is back.",
        pending: true,
      }, { status: 503 });
    }
    if (err instanceof AlignmentRetryConflict) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const message = (err as Error).message;
    const status = message === "Unknown site" ? 404 : message === "Evidence not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
