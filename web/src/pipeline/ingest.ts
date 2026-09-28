import type { Db } from "@/ledger/db";
import * as repo from "@/ledger/repo";
import type { EvidenceSource, EvidenceStatus, Flag, LatLon, MediaAnalysis, ProjectType, RegistrationResult, Site } from "@/domain/types";
import type { MediaPort } from "@/ports/media";
import { DecisionsUnavailable, type DecisionsPort, type TriageInput, type TriageResult } from "@/ports/decisions";
import { RegistrationUnavailable, type RegistrationPort } from "@/ports/registration";
import { WeatherUnavailable, type WeatherPort } from "@/ports/weather";
import { nearestSites } from "@/domain/geo";
import { checkIntegrity, checkWeatherPlausibility, type PriorHash } from "@/domain/integrity";
import { decideStatus } from "@/domain/status";
import { THRESHOLDS } from "@/domain/thresholds";
import { timepointOf } from "@/domain/timepoint";
import { assessSite } from "./assess";
import { updateAgreement } from "./agreement";

export interface PipelineDeps {
  db: Db;
  media: MediaPort;
  decisions: DecisionsPort;
  registration: RegistrationPort;
  weather: WeatherPort;
}

export interface AssetMeta {
  filename?: string;
  sentAt?: string;
  sender?: string;
  comment?: string;
  gps?: LatLon;
  timeSource?: string;
}


export interface IngestRequest {
  projectId: string;
  source: EvidenceSource;
  assetIds: string[];
  batchId: string;
  siteId?: string;
  meta?: Record<string, AssetMeta>;
}

export type PipelineEvent =
  | { type: "analyzed"; assetId: string; thumbUrl: string }
  | { type: "decided"; assetId: string; status: EvidenceStatus; siteId: string | null; reason: string | null; flags: Flag[]; relevance: string; siteConfidence: number | null }
  | { type: "pending"; assetId: string; reason: string }
  | { type: "assessed"; siteId: string; timepoint: string; grade: number | null; status: string }
  | { type: "done"; batchId: string; total: number; usage: { inputTokens: number; usd: number; decisions: number } };

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]!);
      }
    })
  );
  return out;
}

function evidenceRow(req: IngestRequest, a: MediaAnalysis, m: AssetMeta | undefined) {
  return {
    assetId: a.assetId,
    projectId: req.projectId,
    siteId: req.siteId ?? null,
    batchId: req.batchId,
    source: req.source,
    status: "pending",
    secureUrl: a.secureUrl,
    width: a.width,
    height: a.height,
    caption: a.caption,
    tags: a.tags,
    ocrText: a.ocrText,
    capturedAt: a.capturedAt ? new Date(a.capturedAt) : null,
    timepoint: a.capturedAt ? timepointOf(a.capturedAt) : null,
    lat: a.gps?.lat ?? null,
    lon: a.gps?.lon ?? null,
    phash: a.phash,
    faceCount: a.faceCount,
    missingSignals: a.missingSignals,
    filename: m?.filename ?? null,
    sender: m?.sender ?? null,
    comment: m?.comment ?? null,
    flags: [] as Flag[],
  };
}

export function candidatesFor(a: MediaAnalysis, sites: Site[]): TriageInput["candidateSites"] {
  if (a.gps) {
    const near = nearestSites(a.gps, sites, { maxM: THRESHOLDS.candidateSiteMaxM, limit: THRESHOLDS.candidateSiteLimit });
    if (near.length) return near.map(({ site, distanceM }) => ({ id: site.id, name: site.name, description: site.description, distanceM }));
  }
  return sites.slice(0, THRESHOLDS.candidateSiteLimit).map((s) => ({ id: s.id, name: s.name, description: s.description, distanceM: null }));
}

export async function ingestBatch(deps: PipelineDeps, req: IngestRequest, emit: (e: PipelineEvent) => void = () => {}) {
  const { db, media, decisions, registration, weather } = deps;
  const project = await repo.project(db, req.projectId);
  if (!project) throw new Error(`Unknown project ${req.projectId}`);
  const type = project.type as ProjectType;
  const sites = await repo.sitesForProject(db, req.projectId);
  const siteById = new Map(sites.map((s) => [s.id, s]));

  // 1. Analyze (Cloudinary) and record as pending.
  const notes = new Map<string, Flag[]>();
  const analyses = await mapLimit(req.assetIds, 6, async (id) => {
    let a = await media.analyze(id);
    const m = req.meta?.[id];
    const n: Flag[] = [];
    if (!a.capturedAt && m?.sentAt) {
      a = { ...a, capturedAt: m.sentAt };
      n.push({ kind: "capture_time_from_chat", detail: `Capture time taken from ${m.timeSource ?? "the WhatsApp message time"}.`, relatedAssetIds: [] });
    }
    if (!a.gps && m?.gps) a = { ...a, gps: m.gps };
    if (!a.capturedAt) n.push({ kind: "date_unknown", detail: "No capture time in the photo or chat.", relatedAssetIds: [] });

    notes.set(id, n);
    await repo.upsertEvidence(db, evidenceRow(req, a, m));
    emit({ type: "analyzed", assetId: id, thumbUrl: a.secureUrl });
    return a;
  });

  // 2. Triage (Jev), batched.
  const inputs: TriageInput[] = analyses.map((a) => ({
    assetId: a.assetId,
    projectType: type,
    card: {
      caption: a.caption,
      tags: a.tags,
      ocrText: a.ocrText,
      comment: req.meta?.[a.assetId]?.comment ?? null,
      filename: req.meta?.[a.assetId]?.filename ?? null,
      capturedAt: a.capturedAt,
    },
    candidateSites: req.siteId ? [] : candidatesFor(a, sites),
  }));
  let triage: TriageResult[];
  try {
    triage = await decisions.triage(inputs);
  } catch (e) {
    if (!(e instanceof DecisionsUnavailable)) throw e;
    for (const a of analyses) {
      await repo.recordPending(db, "triage_relevance", a.assetId, e.message);
      await repo.upsertEvidence(db, {
        ...evidenceRow(req, a, req.meta?.[a.assetId]),
        status: "pending",
        statusReason: "Decisions pending: Jev unavailable",
        flags: notes.get(a.assetId) ?? [],
      });
      emit({ type: "pending", assetId: a.assetId, reason: "Jev unavailable" });
    }
    emit({ type: "done", batchId: req.batchId, total: analyses.length, usage: await repo.batchUsage(db, req.batchId) });
    return;
  }
  const triageById = new Map(triage.map((t) => [t.assetId, t]));

  // 3. Per asset, in capture order so the earliest of a duplicate pair is kept.
  const priors: PriorHash[] = (await repo.priorHashes(db, req.projectId)).filter((p) => p.batchId !== req.batchId);
  const ordered = [...analyses].sort((x, y) => (x.capturedAt ?? "9").localeCompare(y.capturedAt ?? "9"));
  const touched = new Map<string, Set<string>>(); // siteId -> timepoints

  for (const a of ordered) {
    const t = triageById.get(a.assetId)!;
    for (const d of [t.site, t.relevance, t.activity]) if (d) await repo.recordDecision(db, d);

    const siteId = req.siteId ?? (t.site && t.site.answer !== "none" && siteById.has(t.site.answer) ? t.site.answer : null);
    const site = siteId ? siteById.get(siteId)! : null;
    const day = a.capturedAt ? timepointOf(a.capturedAt) : null;
    // Date-independent lookup, so an old photo is still checked against the claim it is submitted for.
    const claim = (day && (await repo.activeClaim(db, req.projectId, siteId, day))) || (await repo.claimFor(db, req.projectId, siteId));
    const flags: Flag[] = [
      ...(notes.get(a.assetId) ?? []),
      ...checkIntegrity({ analysis: a, site, period: claim ? { start: claim.periodStart, end: claim.periodEnd } : null, priors }).filter(
        (f) => !(f.kind === "location_inferred" && req.siteId)
      ), // QR location is known
    ];

    if (a.gps && day && claim?.text) {
      try {
        const w = await weather.historical({ lat: a.gps.lat, lon: a.gps.lon, date: day });
        flags.push(...checkWeatherPlausibility({ claimText: claim.text, weather: w }));
      } catch (e) {
        if (!(e instanceof WeatherUnavailable)) throw e;
        // Weather is a bonus signal, not a hard dependency; skip silently rather than blocking triage.
      }
    }

    let reg: RegistrationResult | null = null;
    let regPending = false;
    const canRegister = site?.baselineAssetId && site.baselineAssetId !== a.assetId && t.relevance.answer === "evidence" && !flags.some((f) => f.kind === "duplicate");
    if (site && canRegister) {
      const baseline = await repo.evidenceItem(db, site.baselineAssetId!);
      if (baseline) {
        try {
          reg = await registration.register({
            siteId: site.id,
            baselineAssetId: baseline.assetId,
            baselineUrl: baseline.secureUrl,
            followupAssetId: a.assetId,
            followupUrl: a.secureUrl,
          });
          await repo.insertDerivative(db, {
            sourceAssetId: a.assetId,
            baselineAssetId: baseline.assetId,
            siteId: site.id,
            quality: reg.quality,
            inliers: reg.inliers,
            inlierRatio: reg.inlierRatio,
            homography: reg.homography,
            alignedAssetId: reg.alignedAssetId,
            differenceAssetId: reg.differenceAssetId,
            inlierPoints: reg.inlierPoints,
            metrics: reg.metrics as Record<string, number> | null,
          });
          if (reg.quality === "failed") {
            flags.push({
              kind: "possible_different_location",
              detail: `Could not align to the ${site.name} baseline (${reg.inliers} matching points).`,
              relatedAssetIds: [baseline.assetId],
            });
          }
        } catch (e) {
          if (!(e instanceof RegistrationUnavailable)) throw e;
          regPending = true;
        }
      }
    }

    const { status, reason } = regPending
      ? { status: "pending" as const, reason: "Alignment pending: CV worker unavailable" }
      : decideStatus({ relevance: t.relevance, site: t.site, siteId, flags, registration: reg });

    await repo.upsertEvidence(db, {
      ...evidenceRow(req, a, req.meta?.[a.assetId]),
      siteId,
      status,
      statusReason: reason,
      relevance: t.relevance.answer,
      activity: t.activity.answer,
      flags,
    });
    try {
      await media.setContext(a.assetId, { project_id: req.projectId, site_id: siteId ?? "none", status });
    } catch {
      /* context is a mirror; ledger is the source of truth */
    }
    if (a.phash) priors.push({ assetId: a.assetId, siteId, phash: a.phash, capturedAt: a.capturedAt });
    emit({ type: "decided", assetId: a.assetId, status, siteId, reason, flags, relevance: t.relevance.answer, siteConfidence: t.site?.confidence ?? null });

    if (siteId && day && reg && reg.quality !== "failed" && status !== "set_aside") {
      if (!touched.has(siteId)) touched.set(siteId, new Set());
      touched.get(siteId)!.add(day);
    }
    if (siteId && req.source === "witness" && !touched.has(siteId)) touched.set(siteId, new Set());
  }

  // 4. Grade touched site/timepoints, then refresh witness agreement.
  for (const [siteId, days] of touched) {
    for (const day of days) {
      const r = await assessSite(deps, siteId, day);
      if (r) emit({ type: "assessed", siteId, timepoint: day, grade: r.grade, status: r.status });
    }
    const today = [...days].sort().at(-1) ?? timepointOf(new Date().toISOString());
    await updateAgreement(deps, siteId, today);
  }

  emit({ type: "done", batchId: req.batchId, total: analyses.length, usage: await repo.batchUsage(db, req.batchId) });
}
