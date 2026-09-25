import { readFileSync } from "node:fs";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const [projectId, siteId, baselinePath, followPath, otherPath] = process.argv.slice(2);
if (!otherPath) {
  throw new Error("usage: e2e-smoke <projectId> <siteId> <baseline.jpg> <followup.jpg> <other-site.jpg>");
}

async function upload(path: string) {
  const sigRes = await fetch(`${BASE}/api/uploads/sign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId, source: "implementer" }),
  });
  if (!sigRes.ok) throw new Error(`Sign upload failed: ${sigRes.status} ${await sigRes.text()}`);
  const sig = await sigRes.json();

  const form = new FormData();
  form.append("file", new Blob([readFileSync(path)]), path.split(/[\\/]/).pop());
  for (const [k, v] of Object.entries(sig.params as Record<string, string>)) {
    form.append(k, v);
  }
  form.append("api_key", sig.apiKey);
  form.append("signature", sig.signature);

  const r = await (
    await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: form })
  ).json();
  if (!r.public_id) throw new Error(JSON.stringify(r));
  return r.public_id as string;
}

async function main() {
  console.log("Uploading test photos...");
  const [b, f, o] = [await upload(baselinePath), await upload(followPath), await upload(otherPath)];
  console.log("Uploaded assets:", { baseline: b, followup: f, other: o });

  console.log("Ingesting baseline...");
  await fetch(`${BASE}/api/intake`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId, assetIds: [b] }),
  }).then((r) => r.text());

  console.log("Setting baseline...");
  await fetch(`${BASE}/api/sites/${siteId}/baseline`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ assetId: b }),
  });

  console.log("Ingesting follow-up and other site...");
  const res = await fetch(`${BASE}/api/intake`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId, assetIds: [f, o] }),
  });

  for (const line of (await res.text()).trim().split("\n")) {
    console.log(line);
  }
}

main().catch((err) => {
  console.error("e2e-smoke failed:", err);
  process.exit(1);
});
