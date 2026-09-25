import { get, set, del, keys } from "idb-keyval";
import type { LatLon } from "@/domain/types";

export interface OutboxItem {
  id: string;
  blob: Blob;
  slug: string;
  comment?: string;
  gps?: LatLon | null;
  createdAt: string;
}

const OUTBOX_PREFIX = "witness_outbox_";

export async function saveToOutbox(item: Omit<OutboxItem, "id">): Promise<string> {
  const id = `${OUTBOX_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const record: OutboxItem = { ...item, id };
  await set(id, record);
  return id;
}

export async function getOutboxItems(): Promise<OutboxItem[]> {
  try {
    const allKeys = await keys();
    const outboxKeys = allKeys.filter((k) => typeof k === "string" && k.startsWith(OUTBOX_PREFIX));
    const items: OutboxItem[] = [];
    for (const k of outboxKeys) {
      const it = await get<OutboxItem>(k);
      if (it) items.push(it);
    }
    return items;
  } catch (err) {
    console.error("Failed to read outbox:", err);
    return [];
  }
}

export async function flushOutbox(
  onSent?: (item: OutboxItem) => void
): Promise<{ sent: number; failed: number }> {
  const items = await getOutboxItems();
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // 1. Request upload signature
      const sigRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteSlug: item.slug }),
      });
      if (!sigRes.ok) throw new Error("Sign failed");
      const sig = await sigRes.json();

      // 2. Direct upload to Cloudinary
      const form = new FormData();
      form.append("file", item.blob, `witness_${Date.now()}.jpg`);
      for (const [k, v] of Object.entries(sig.params as Record<string, string>)) {
        form.append(k, v);
      }
      form.append("api_key", sig.apiKey);
      form.append("signature", sig.signature);

      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      if (!upRes.ok) throw new Error("Cloudinary upload failed");
      const upData = await upRes.json();

      // 3. Post to witness endpoint
      const witRes = await fetch(`/api/witness/${item.slug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assetId: upData.public_id,
          comment: item.comment,
          gps: item.gps,
        }),
      });
      if (!witRes.ok) throw new Error("Witness ingest failed");

      // Remove from outbox
      await del(item.id);
      sent++;
      onSent?.(item);
    } catch (err) {
      console.error(`Failed to flush outbox item ${item.id}:`, err);
      failed++;
    }
  }

  return { sent, failed };
}
