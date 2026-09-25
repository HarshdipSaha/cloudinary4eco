export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { TypeSafeClient } from "@typesafe-ai/sdk";
import { v2 as cloudinary } from "cloudinary";

type S = { state: "up" | "down"; detail: string; checkedAt: string };
let cache: { at: number; value: Record<string, S> } | null = null;

async function check(fn: () => Promise<string>): Promise<S> {
  const checkedAt = new Date().toISOString();
  try {
    return { state: "up", detail: await fn(), checkedAt };
  } catch (e) {
    return { state: "down", detail: (e as Error).message.slice(0, 120), checkedAt };
  }
}

export async function GET() {
  if (cache && Date.now() - cache.at < 30_000) return NextResponse.json(cache.value);
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const [jev, cld, cv] = await Promise.all([
    check(async () => {
      const c = new TypeSafeClient({
        apiKey: process.env.TYPESAFE_API_KEY ?? process.env.JEV_API_KEY,
        timeout: 4000,
        retry: { maxRetries: 0 },
      });
      const models = await c.models.list();
      return `model ${process.env.TYPESAFE_DEFAULT_MODEL ?? "jev-latest"} (${models.length} available)`;
    }),
    check(async () => {
      await cloudinary.api.ping();
      return "reachable";
    }),
    check(async () => {
      const r = await fetch(`${process.env.CV_WORKER_URL}/health`, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return "reachable";
    }),
  ]);
  cache = { at: Date.now(), value: { jev, cloudinary: cld, cv } };
  return NextResponse.json(cache.value);
}
