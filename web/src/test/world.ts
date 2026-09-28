import { createTestDb, type Db } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import { FakeDecisions, FakeMedia, FakeRegistration, FakeWeather, analysis } from "./fakes";

export async function world() {
  const db: Db = await createTestDb();
  const media = new FakeMedia();
  const decisions = new FakeDecisions();
  const registration = new FakeRegistration();
  const weather = new FakeWeather();
  await repo.createProject(db, { id: "p1", name: "Yamuna Green", type: "plantation" });
  await repo.createSite(db, {
    id: "s1",
    projectId: "p1",
    name: "Plot B",
    description: "Riverside strip by the ghat",
    location: { lat: 28.6, lon: 77.2 },
    radiusM: 100,
    baselineAssetId: null,
    qrSlug: "plot-b",
  });
  await repo.createSite(db, {
    id: "s2",
    projectId: "p1",
    name: "Plot C",
    description: "School boundary wall",
    location: { lat: 28.65, lon: 77.25 },
    radiusM: 100,
    baselineAssetId: null,
    qrSlug: "plot-c",
  });
  await repo.createClaim(db, {
    id: "c1",
    projectId: "p1",
    siteId: "s1",
    periodStart: "2026-09-20",
    periodEnd: "2026-10-10",
    text: "300 saplings planted and established in Plot B",
  });

  const base = analysis("base-s1", {
    capturedAt: "2026-09-21T09:00:00+05:30",
    caption: "bare dry ground beside a wall",
    phash: "1111111111111111",
  });
  media.add(base);
  await repo.upsertEvidence(db, {
    assetId: base.assetId,
    projectId: "p1",
    siteId: "s1",
    source: "implementer",
    status: "accepted",
    secureUrl: base.secureUrl,
    width: base.width,
    height: base.height,
    caption: base.caption,
    tags: base.tags,
    capturedAt: new Date(base.capturedAt!),
    timepoint: "2026-09-21",
    lat: 28.6,
    lon: 77.2,
    phash: base.phash,
    missingSignals: [],
    flags: [],
  });
  await repo.setBaseline(db, "s1", "base-s1");

  return { db, media, decisions, registration, weather, deps: { db, media, decisions, registration, weather } };
}
