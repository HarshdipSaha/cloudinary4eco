// Writes real ledger cards with an empty label for a person to fill in; labelled rows are then moved into cases.jsonl.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "../src/ledger/db";
import * as repo from "../src/ledger/repo";

const projectId = process.argv[2];
if (!projectId) {
  console.error("usage: npm run calibration:export -- <projectId>");
  process.exit(1);
}
const db = await getDb();
const project = await repo.project(db, projectId);
if (!project) throw new Error(`Unknown project ${projectId}`);
const rows = await repo.evidenceForProject(db, projectId, 500);
const lines = rows.map((e) =>
  JSON.stringify({
    id: `ledger_${e.assetId.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`,
    origin: "ledger",
    note: "",
    kind: "triage_relevance",
    projectType: project.type,
    card: {
      caption: e.caption,
      tags: e.tags,
      ocrText: e.ocrText,
      comment: e.comment,
      filename: e.filename,
      capturedAt: e.capturedAt?.toISOString() ?? null,
    },
    label: null,
  })
);
const out = resolve(process.cwd(), "calibration/ledger-candidates.jsonl");
writeFileSync(out, lines.join("\n") + "\n");
console.log(`Wrote ${lines.length} unlabelled ledger cards to ${out}. Label each from the rubric, write a note, then move rows into cases.jsonl.`);
process.exit(0);
