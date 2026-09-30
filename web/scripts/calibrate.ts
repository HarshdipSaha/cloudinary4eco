import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { jevDecisions } from "../src/adapters/jev/client";
import { casesSha256, parseCases } from "../src/calibration/cases";
import { runEvaluation, summarise } from "../src/calibration/evaluate";
import { DecisionsUnavailable } from "../src/ports/decisions";

// Every number written here comes from a live Jev call on calibration/cases.jsonl. Nothing is hard-coded,
// and nothing is written unless the whole run succeeds.
async function run() {
  if (!process.env.TYPESAFE_API_KEY && !process.env.JEV_API_KEY) {
    console.error("TYPESAFE_API_KEY is required: calibration results must come from live Jev decisions.");
    process.exit(1);
  }
  const text = readFileSync(resolve(process.cwd(), "calibration/cases.jsonl"), "utf8");
  const cases = parseCases(text);
  console.log(`Evaluating ${cases.length} cases with live Jev...`);

  const runAt = new Date().toISOString();
  const predictions = await runEvaluation(jevDecisions({ timeoutMs: 30_000 }), cases);

  const results = {
    source: "live-jev" as const,
    runAt,
    model: [...new Set(predictions.map((p) => p.model))].join(", "),
    casesSha256: casesSha256(text),
    n: predictions.length,
    ...summarise(predictions),
  };
  writeFileSync(resolve(process.cwd(), "calibration/results.json"), JSON.stringify(results, null, 2) + "\n");
  writeFileSync(resolve(process.cwd(), "calibration/predictions.jsonl"), predictions.map((p) => JSON.stringify(p)).join("\n") + "\n");

  console.table(
    Object.entries(results.kinds).map(([kind, k]) => ({
      kind,
      test: k.nTest,
      accuracy: k.test.accuracy,
      brier: k.test.brier,
      ece: k.test.ece,
      threshold: k.threshold,
      coverageOnTest: k.thresholdOnTest.coverage,
      accuracyAboveThreshold: k.thresholdOnTest.accuracy,
    }))
  );
}

run().catch((e) => {
  console.error(e instanceof DecisionsUnavailable ? `Jev unavailable; nothing written. ${e.message}` : e);
  process.exit(1);
});
