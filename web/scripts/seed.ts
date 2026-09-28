import { readFileSync } from "node:fs";
import { getDb } from "../src/ledger/db";
import * as repo from "../src/ledger/repo";

const seed = JSON.parse(readFileSync("./design/seed.json", "utf8"));
const db = await getDb();
for (const p of seed.projects) {
  if (!(await repo.project(db, p.id))) await repo.createProject(db, { id: p.id, name: p.name, type: p.type });
  for (const s of p.sites) {
    if (s.lat === 0 && s.lon === 0) throw new Error(`Site ${s.id} still has placeholder coordinates`);
    if (!(await repo.site(db, s.id))) {
      await repo.createSite(db, {
        id: s.id,
        projectId: p.id,
        name: s.name,
        description: s.description,
        location: { lat: s.lat, lon: s.lon },
        radiusM: s.radiusM,
        baselineAssetId: null,
        qrSlug: s.qrSlug,
      });
    }
  }
  for (const c of p.claims) await repo.createClaim(db, { ...c, projectId: p.id }).catch(() => {});
}
console.log("seeded", seed.projects.map((p: { id: string }) => p.id).join(", "));
