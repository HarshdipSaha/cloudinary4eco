import * as repo from "@/ledger/repo";
import { DecisionsUnavailable } from "@/ports/decisions";
import { THRESHOLDS } from "@/domain/thresholds";
import type { PipelineDeps } from "@/pipeline/ingest";

export interface SearchFilters {
  projectId: string;
  siteId?: string;
  from?: string;
  to?: string;
}
export interface SearchRequest extends SearchFilters {
  query?: string;
  status?: string;
  source?: string;
  grade?: number;
  flagged?: boolean;
}

export function buildExpression(f: SearchFilters, folder = process.env.CLOUDINARY_FOLDER ?? "saakshya") {
  const parts = [`folder:"${folder}/${f.projectId}/*"`];
  if (f.siteId) parts.push(`context.site_id="${f.siteId}"`);
  if (f.from) parts.push(`uploaded_at>="${f.from}"`);
  if (f.to) parts.push(`uploaded_at<="${f.to}"`);
  return parts.join(" AND ");
}

export async function search(deps: PipelineDeps, req: SearchRequest) {
  const { db, media, decisions } = deps;
  let rows: (typeof repo.t.evidence.$inferSelect)[] = [];
  try {
    const ids = await media.searchIds(buildExpression(req), 100);
    if (ids.length) {
      rows = (await repo.evidenceByIds(db, ids)).filter((r) => r.projectId === req.projectId);
    }
  } catch (err) {
    // Cloudinary search API is optional / unprovisioned on some plans; fall back to local ledger
  }

  if (!rows.length) {
    rows = await repo.evidenceForProject(db, req.projectId);
    if (req.siteId) rows = rows.filter((r) => r.siteId === req.siteId);
    if (req.from) rows = rows.filter((r) => (r.timepoint ?? "") >= req.from!);
    if (req.to) rows = rows.filter((r) => (r.timepoint ?? "") <= req.to!);
  }

  const sites = new Map((await repo.sitesForProject(db, req.projectId)).map((s) => [s.id, s.name]));
  if (req.status) rows = rows.filter((r) => r.status === req.status);
  if (req.source) rows = rows.filter((r) => r.source === req.source);

  if (req.flagged !== undefined) {
    rows = rows.filter((r) => (req.flagged ? (r.flags?.length ?? 0) > 0 : (r.flags?.length ?? 0) === 0));
  }
  if (req.grade !== undefined) {
    const siteIds = [...new Set(rows.map((r) => r.siteId).filter(Boolean))] as string[];
    const gradeAssessments = await Promise.all(siteIds.map((sid) => repo.assessmentsForSite(db, sid)));
    const matchingTimepoints = new Set<string>();
    for (const list of gradeAssessments) {
      for (const a of list) {
        if (a.grade === req.grade) matchingTimepoints.add(`${a.siteId}@${a.timepoint}`);
      }
    }
    rows = rows.filter((r) => r.siteId && r.timepoint && matchingTimepoints.has(`${r.siteId}@${r.timepoint}`));
  }
  rows.sort((a, b) => (b.timepoint ?? "").localeCompare(a.timepoint ?? ""));

  const plain = rows.map((r) => ({ assetId: r.assetId, row: r, score: null as number | null }));
  if (!req.query?.trim()) return { reranked: false, items: plain };

  const cards = rows.map((r) => ({
    id: r.assetId,
    text: [
      sites.get(r.siteId ?? "") ?? "unassigned site",
      r.timepoint ?? "unknown date",
      r.caption ?? "",
      r.tags.length ? `tags: ${r.tags.join(", ")}` : "",
      r.activity ? `activity: ${r.activity}` : "",
      r.comment ? `comment: ${r.comment}` : "",
      r.source === "witness" ? "community witness photo" : "",
    ]
      .filter(Boolean)
      .join("; "),
  }));
  try {
    const ds = await decisions.searchRelevance(req.query, cards);
    const scored = ds
      .map((d, i) => ({ assetId: rows[i]!.assetId, row: rows[i]!, score: d.answer }))
      .filter((x) => x.score >= THRESHOLDS.searchKeep)
      .sort((a, b) => b.score - a.score);
    return { reranked: true, items: scored };
  } catch (e) {
    if (!(e instanceof DecisionsUnavailable)) throw e;
    return { reranked: false, items: plain };
  }
}
