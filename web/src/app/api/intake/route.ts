export const runtime = "nodejs";
export const maxDuration = 300;

import { z } from "zod";
import { nanoid } from "nanoid";
import { deps } from "@/adapters/container";
import { ingestBatch } from "@/pipeline/ingest";

const Body = z.object({
  projectId: z.string(),
  assetIds: z.array(z.string()).min(1).max(600),
  meta: z
    .record(
      z.object({
        filename: z.string().optional(),
        sentAt: z.string().optional(),
        sender: z.string().optional(),
        comment: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(req: Request) {
  const body = Body.parse(await req.json());
  const batchId = nanoid(10);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(o)}\n`));
      send({ type: "batch", batchId, total: body.assetIds.length });
      try {
        await ingestBatch(await deps(), { projectId: body.projectId, source: "bulk_import", assetIds: body.assetIds, batchId, meta: body.meta }, send);
      } catch (e) {
        send({ type: "error", message: (e as Error).message });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
}
