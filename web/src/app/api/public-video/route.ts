import { deps } from "@/adapters/container";
import { importPublicVideoEvidence, parsePublicVideoRequest } from "@/pipeline/public-video";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  let body: ReturnType<typeof parsePublicVideoRequest>;
  try {
    body = parsePublicVideoRequest(await req.json());
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await importPublicVideoEvidence(await deps(), body, send);
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? error.message : String(error) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" },
  });
}
