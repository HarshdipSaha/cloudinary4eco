import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkMarkdown, checkRepo } from "./check-doc-claims.mjs";

function repo(files) {
  const root = mkdtempSync(join(tmpdir(), "claims-"));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), body);
  }
  return root;
}

const claims = { "demo.count": () => "3" };

test("accepts a marker whose value matches its source", () => {
  const root = repo({ "README.md": "We keep <!-- claim:demo.count -->3<!-- /claim --> frames." });
  assert.deepEqual(checkMarkdown(root, "README.md", claims), []);
});

test("reports a stale marker value", () => {
  const root = repo({ "README.md": "We keep <!-- claim:demo.count -->5<!-- /claim --> frames." });
  const [problem] = checkMarkdown(root, "README.md", claims);
  assert.match(problem, /README\.md: claim demo\.count says "5" but source says "3"/);
});

test("reports an unknown claim key", () => {
  const root = repo({ "README.md": "<!-- claim:nope -->1<!-- /claim -->" });
  assert.match(checkMarkdown(root, "README.md", claims)[0], /unknown claim "nope"/);
});

test("reports missing relative link targets but ignores URLs and anchors", () => {
  const root = repo({
    "docs/A.md": "[ok](B.md) [gone](missing.md) [web](https://x.test) [anchor](#top) [withanchor](B.md#part)",
    "docs/B.md": "b",
  });
  const problems = checkMarkdown(root, "docs/A.md", claims);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /docs\/A\.md: link target "missing\.md" does not exist/);
});

test("reports backticked repository paths that do not exist", () => {
  const root = repo({ "README.md": "See `web/src/real.ts` and `cv/app/gone.py` and `web/src/<id>.ts`.", "web/src/real.ts": "" });
  const problems = checkMarkdown(root, "README.md", claims);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /path "cv\/app\/gone\.py" does not exist/);
});

test("allows documented local-only config files that are gitignored", () => {
  const root = repo({ "README.md": "Edit `web/.env` and `cv/.env`, but not `web/other.env`." });
  const problems = checkMarkdown(root, "README.md", claims);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /web\/other\.env/);
});

test("checkRepo scans README, top-level docs, and cv/benchmarks/README.md", () => {
  const root = repo({
    "README.md": "ok",
    "docs/X.md": "`web/nope.ts`",
    "docs/superpowers/plans/old.md": "`web/historic.ts`",
    "cv/benchmarks/README.md": "ok",
  });
  const problems = checkRepo(root, claims, []);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /docs\/X\.md/);
});

import { benchmarkFingerprint, normalisedSha256 } from "./check-doc-claims.mjs";

test("benchmark fingerprint fails when results were produced from a different manifest", () => {
  const root = repo({
    "cv/benchmarks/cases.json": '{"cases":[]}\n',
    "cv/benchmarks/photo-benchmark-results.json": JSON.stringify({ manifest_sha256: "stale", cases: [] }),
  });
  assert.match(benchmarkFingerprint(root)[0], /regenerate the benchmark results/);
});

test("benchmark fingerprint passes with matching hash regardless of line endings", () => {
  const root = repo({ "cv/benchmarks/cases.json": '{\r\n"cases":[]\r\n}\r\n' });
  writeFileSync(join(root, "cv/benchmarks/photo-benchmark-results.json"),
    JSON.stringify({ manifest_sha256: normalisedSha256('{\n"cases":[]\n}\n'), cases: [] }));
  assert.deepEqual(benchmarkFingerprint(root), []);
});

import { calibrationFingerprint } from "./check-doc-claims.mjs";

test("calibration fingerprint passes when no results are committed", () => {
  const root = repo({ "web/calibration/cases.jsonl": "{}\n" });
  assert.deepEqual(calibrationFingerprint(root), []);
});

test("calibration fingerprint fails for results from another corpus or a non-live source", () => {
  const root = repo({
    "web/calibration/cases.jsonl": "{}\n",
    "web/calibration/results.json": JSON.stringify({ source: "hand", casesSha256: "x", n: 1 }),
  });
  const problems = calibrationFingerprint(root);
  assert.ok(problems.some((p) => /live-jev/.test(p)));
  assert.ok(problems.some((p) => /rerun npm run calibrate/.test(p)));
});

test("calibration fingerprint passes for live results that match the corpus", () => {
  const cases = '{"id":"a"}\n';
  const root = repo({ "web/calibration/cases.jsonl": cases });
  writeFileSync(join(root, "web/calibration/results.json"), JSON.stringify({ source: "live-jev", casesSha256: normalisedSha256(cases), n: 1 }));
  assert.deepEqual(calibrationFingerprint(root), []);
});
